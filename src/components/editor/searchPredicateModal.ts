import IPromise = angular.IPromise;
import IScope = angular.IScope;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import * as _ from 'lodash';
import { Predicate, PredicateListItem, Model, ModelListItem, Type, Uri } from '../../services/entities';
import { PredicateService} from '../../services/predicateService';
import { SearchConceptModal, ConceptCreation } from './searchConceptModal';
import { LanguageService } from '../../services/languageService';
import { EditableForm } from '../form/editableEntityController';
import gettextCatalog = angular.gettext.gettextCatalog;

export class SearchPredicateModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private openModal(model: Model, type: Type, excludedPredicates: Set<Uri>, onlySelection: boolean) {
    return this.$uibModal.open({
      template: require('./searchPredicateModal.html'),
      size: 'large',
      controller: SearchPredicateController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        model: () => model,
        type: () => type,
        excludedPredicates: () => excludedPredicates,
        onlySelection: () => onlySelection
      }
    }).result;
  }

  open(model: Model, type: Type, excludedPredicates: Set<Uri>): IPromise<ConceptCreation|Predicate> {
    return this.openModal(model, type, excludedPredicates, false);
  }

  openForProperty(model: Model, excludedPredicates: Set<Uri>): IPromise<Predicate> {
    return this.openModal(model, null, excludedPredicates, false);
  }

  openWithOnlySelection(model: Model, type: Type, excludedPredicates: Set<Uri> = new Set<Uri>()): IPromise<Predicate> {
    return this.openModal(model, type, excludedPredicates, true);
  }
};

export interface SearchPredicateScope extends IScope {
  form: EditableForm;
}

class SearchResult {
  constructor(public predicate: PredicateListItem, public disabled: boolean) {}
}

export class SearchPredicateController {

  private predicates: PredicateListItem[];

  close = this.$uibModalInstance.dismiss;
  searchResults: SearchResult[];
  selectedPredicate: Predicate;
  selectedItem: SearchResult;
  searchText: string = '';
  modelId: Uri;
  models: ModelListItem[];
  types: Type[];
  typeSelectable: boolean;
  submitError: string;

  /* @ngInject */
  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              public model: Model,
              public type: Type,
              private excludedPredicates: Set<Uri>,
              public onlySelection: boolean,
              private predicateService: PredicateService,
              private languageService: LanguageService,
              private searchConceptModal: SearchConceptModal,
              private gettextCatalog: gettextCatalog) {

    predicateService.getAllPredicates().then((allPredicates: PredicateListItem[]) => {
      this.typeSelectable = !type;
      this.predicates = allPredicates;

      this.models = _.chain(this.predicates)
        .filter(predicate => this.requireFilter(predicate))
        .map(predicate => predicate.model)
        .uniq(classModel => classModel.id)
        .value();

      this.types = _.chain(this.predicates)
        .map(predicate => predicate.type)
        .uniq()
        .value();

      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.type, () => this.search());
    $scope.$watch(() => this.modelId, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.predicates)
      .filter(predicate => this.requireFilter(predicate))
      .filter(predicate => this.textFilter(predicate))
      .filter(predicate => this.modelFilter(predicate))
      .filter(predicate => this.typeFilter(predicate))
      .sortBy(predicate => this.localizedLabelAsLower(predicate))
      .map(predicate => new SearchResult(predicate, this.excludedPredicates.has(predicate.id)))
      .value();
  }

  selectSearchResult(searchResult: SearchResult) {
    if (!searchResult.disabled) {
      this.$scope.form.editing = false;
      this.submitError = null;
      this.selectedItem = searchResult;
      this.predicateService.getPredicate(searchResult.predicate.id).then(result => this.selectedPredicate = result);
    }
  }

  searchResultTitle(searchResult: SearchResult) {
    if (searchResult.disabled) {
      return this.gettextCatalog.getString('Already added');
    }
  }

  isSelected(searchResult: SearchResult) {
    return searchResult === this.selectedItem;
  }

  usePredicate() {
    this.$uibModalInstance.close(this.selectedPredicate);
  }

  createAndUsePredicate() {
    return this.predicateService.createPredicate(this.selectedPredicate)
      .then(() => this.usePredicate(), err => this.submitError = err.data.errorMessage);
  }

  createNew(type: Type) {
    const owlType = type === 'association' ? 'owl:ObjectProperty' : 'owl:DatatypeProperty';

    return this.searchConceptModal.openNewCreation(this.model.references, type)
      .then(result => {
        if (!this.typeSelectable) {
          this.$uibModalInstance.close(_.extend(result, {type: owlType}));
        } else {
          this.predicateService.newPredicate(this.model, result.label, result.concept.id, owlType, this.languageService.modelLanguage)
            .then(predicate => {
              this.selectedPredicate = predicate;
              this.$scope.form.editing = true;
            });
        }
      });
  }

  isEditing(): boolean {
    return this.$scope.form && this.$scope.form.editing;
  }

  isAttributeAddable(): boolean {
    return this.typeSelectable || this.type === 'attribute';
  }

  isAssociationAddable(): boolean {
    return this.typeSelectable || this.type === 'association';
  }

  private localizedLabelAsLower(predicate: PredicateListItem): string {
    return this.languageService.translate(predicate.label).toLowerCase();
  }

  private textFilter(predicate: PredicateListItem): boolean {
    return !this.searchText || this.localizedLabelAsLower(predicate).includes(this.searchText.toLowerCase());
  }

  private modelFilter(predicate: PredicateListItem): boolean {
    return !this.modelId || predicate.model.id === this.modelId;
  }

  private typeFilter(predicate: PredicateListItem): boolean {
    return !this.type || predicate.type === this.type;
  }

  private requireFilter(predicate: PredicateListItem): boolean {
    let modelIds = _.chain(this.model.requires).map(require => require.id).concat(this.model.id).value();
    return _.any(modelIds, id => id === predicate.model.id);
  }
}
