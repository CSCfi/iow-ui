import IPromise = angular.IPromise;
import IScope = angular.IScope;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import * as _ from 'lodash';
import { Predicate, PredicateListItem, Model, Type, Uri, DefinedBy } from '../../services/entities';
import { PredicateService } from '../../services/predicateService';
import { SearchConceptModal, EntityCreation } from './searchConceptModal';
import { LanguageService } from '../../services/languageService';
import { EditableForm } from '../form/editableEntityController';
import { comparingString, comparingBoolean, reversed } from '../../services/comparators';
import { AddNew } from '../common/searchResults';
import gettextCatalog = angular.gettext.gettextCatalog;
import { isDefined } from '../../services/utils';

const noExclude = (item: PredicateListItem) => <string> null;

export class SearchPredicateModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private openModal(model: Model, type: Type, exclude: (predicate: PredicateListItem) => string, onlySelection: boolean) {
    return this.$uibModal.open({
      template: require('./searchPredicateModal.html'),
      size: 'large',
      controller: SearchPredicateController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        type: () => type,
        exclude: () => exclude,
        onlySelection: () => onlySelection
      }
    }).result;
  }

  open(model: Model, type: Type, exclude: (predicate: PredicateListItem) => string = noExclude): IPromise<EntityCreation|Predicate> {
    return this.openModal(model, type, exclude, false);
  }

  openForProperty(model: Model, exclude: (predicate: PredicateListItem) => string = noExclude): IPromise<Predicate> {
    return this.openModal(model, null, exclude, false);
  }

  openWithOnlySelection(model: Model, type: Type, exclude: (predicate: PredicateListItem) => string = noExclude): IPromise<Predicate> {
    return this.openModal(model, type, exclude, true);
  }
};

export interface SearchPredicateScope extends IScope {
  form: EditableForm;
}

export class SearchPredicateController {

  private predicates: PredicateListItem[];

  editInProgress = () => this.$scope.form.editing;
  close = this.$uibModalInstance.dismiss;
  searchResults: (PredicateListItem|AddNewPredicate)[] = [];
  selection: Predicate;
  searchText: string = '';
  showModel: DefinedBy;
  models: DefinedBy[];
  types: Type[];
  typeSelectable: boolean;
  submitError: string;
  cannotConfirm: string;
  loadingResults: boolean;
  selectedItem: PredicateListItem|AddNewPredicate;

  /* @ngInject */
  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              public model: Model,
              public type: Type,
              public exclude: (predicate: PredicateListItem) => string,
              public onlySelection: boolean,
              private predicateService: PredicateService,
              private languageService: LanguageService,
              private searchConceptModal: SearchConceptModal,
              private gettextCatalog: gettextCatalog) {

    this.loadingResults = true;

    predicateService.getAllPredicates().then((allPredicates: PredicateListItem[]) => {
      this.typeSelectable = !type;
      this.predicates = allPredicates;

      this.models = _.chain(this.predicates)
        .map(predicate => predicate.definedBy)
        .uniq(definedBy => definedBy.id.uri)
        .sort(languageService.labelComparison)
        .value();

      this.types = _.chain(this.predicates)
        .map(predicate => predicate.normalizedType)
        .uniq()
        .value();

      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.type, () => this.search());
    $scope.$watch(() => this.showModel, () => this.search());
  }

  get showExcluded() {
    return !!this.searchText;
  }

  search() {
    if (this.predicates) {

      const result: (PredicateListItem|AddNewPredicate)[] = [
        new AddNewPredicate(`${this.gettextCatalog.getString('Create new attribute')} '${this.searchText}'`, this.isAttributeAddable.bind(this), 'attribute'),
        new AddNewPredicate(`${this.gettextCatalog.getString('Create new association')} '${this.searchText}'`, this.isAssociationAddable.bind(this), 'association')
      ];

      const predicateSearchResult = this.predicates.filter(predicate =>
        this.textFilter(predicate) &&
        this.modelFilter(predicate) &&
        this.typeFilter(predicate) &&
        this.excludedFilter(predicate)
      );

      predicateSearchResult.sort(
        comparingBoolean((item: PredicateListItem) => !!this.exclude(item))
          .andThen(comparingString(this.localizedLabelAsLower.bind(this))));

      this.searchResults = result.concat(predicateSearchResult);
    }

    this.loadingResults = !isDefined(this.predicates);
  }

  selectItem(item: PredicateListItem|AddNewPredicate) {
    this.selectedItem = item;
    if (item instanceof AddNewPredicate) {
      this.createNew(item.type);
    } else if (item instanceof PredicateListItem) {
      this.$scope.form.editing = false;
      this.submitError = null;
      this.cannotConfirm = this.exclude(item);
      this.predicateService.getPredicate(item.id, this.model).then(result => this.selection = result);
    }
  }

  loadingSelection(item: PredicateListItem|AddNew) {
    if (item instanceof PredicateListItem) {
      return item === this.selectedItem && (!this.selection || !item.id.equals(this.selection.id));
    } else {
      return false;
    }
  }

  usePredicate() {
    this.$uibModalInstance.close(this.selection);
  }

  createAndUsePredicate() {
    return this.predicateService.createPredicate(this.selection)
      .then(() => this.usePredicate(), err => this.submitError = err.data.errorMessage);
  }

  createNew(type: Type) {
    return this.searchConceptModal.openNewEntityCreation(this.model.references, type, this.searchText)
      .then(result => {
        if (!this.typeSelectable) {
          this.$uibModalInstance.close(result);
        } else {
          this.predicateService.newPredicate(this.model, result.entity.label, result.concept.id, type, this.languageService.modelLanguage)
            .then(predicate => {
              this.cannotConfirm = null;
              this.selection = predicate;
              this.$scope.form.editing = true;
            });
        }
      });
  }

  isEditing(): boolean {
    return this.$scope.form && this.$scope.form.editing;
  }

  isAttributeAddable(): boolean {
    return this.searchText && (this.typeSelectable || this.type === 'attribute');
  }

  isAssociationAddable(): boolean {
    return this.searchText && (this.typeSelectable || this.type === 'association');
  }

  private localizedLabelAsLower(predicate: PredicateListItem): string {
    return this.languageService.translate(predicate.label).toLowerCase();
  }

  private textFilter(predicate: PredicateListItem): boolean {
    return !this.searchText || this.localizedLabelAsLower(predicate).includes(this.searchText.toLowerCase());
  }

  private modelFilter(predicate: PredicateListItem): boolean {
    return !this.showModel || predicate.definedBy.id.equals(this.showModel.id);
  }

  private typeFilter(predicate: PredicateListItem): boolean {
    return !this.type || predicate.normalizedType === this.type;
  }

  private excludedFilter(predicate: PredicateListItem): boolean {
    return this.showExcluded || !this.exclude(predicate);
  }
}

class AddNewPredicate extends AddNew {
  constructor(public label: string, public show: () => boolean, public type: Type) {
    super(label, show);
  }
}
