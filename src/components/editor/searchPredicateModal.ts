import IPromise = angular.IPromise;
import IScope = angular.IScope;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import * as _ from 'lodash';
import { Predicate, PredicateListItem, Model, Type, Uri, DefinedBy } from '../../services/entities';
import { PredicateService } from '../../services/predicateService';
import { SearchConceptModal, ConceptCreation } from './searchConceptModal';
import { LanguageService } from '../../services/languageService';
import { EditableForm } from '../form/editableEntityController';
import { createDefinedByExclusion, combineExclusions } from '../../services/utils';

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
      backdrop: false,
      resolve: {
        model: () => model,
        type: () => type,
        exclude: () => combineExclusions(exclude, createDefinedByExclusion(model)),
        onlySelection: () => onlySelection
      }
    }).result;
  }

  open(model: Model, type: Type, exclude: (predicate: PredicateListItem) => string): IPromise<ConceptCreation|Predicate> {
    return this.openModal(model, type, exclude, false);
  }

  openForProperty(model: Model, exclude: (predicate: PredicateListItem) => string): IPromise<Predicate> {
    return this.openModal(model, null, exclude, false);
  }

  openWithOnlySelection(model: Model, type: Type, exclude: (predicate: PredicateListItem) => string = (item: PredicateListItem) => null): IPromise<Predicate> {
    return this.openModal(model, type, exclude, true);
  }
};

export interface SearchPredicateScope extends IScope {
  form: EditableForm;
}

export class SearchPredicateController {

  private predicates: PredicateListItem[];

  close = this.$uibModalInstance.dismiss;
  searchResults: PredicateListItem[];
  selectedPredicate: Predicate;
  searchText: string = '';
  modelId: Uri;
  models: DefinedBy[];
  types: Type[];
  typeSelectable: boolean;
  submitError: string;
  showExcluded: boolean;

  /* @ngInject */
  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              public model: Model,
              public type: Type,
              public exclude: (predicate: PredicateListItem) => string,
              public onlySelection: boolean,
              private predicateService: PredicateService,
              private languageService: LanguageService,
              private searchConceptModal: SearchConceptModal) {

    predicateService.getAllPredicates().then((allPredicates: PredicateListItem[]) => {
      this.typeSelectable = !type;
      this.predicates = allPredicates;

      this.models = _.chain(this.predicates)
        .map(predicate => predicate.definedBy)
        .uniq(definedBy => definedBy.id)
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
    $scope.$watch(() => this.modelId, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.predicates)
      .filter(predicate => this.textFilter(predicate))
      .filter(predicate => this.modelFilter(predicate))
      .filter(predicate => this.typeFilter(predicate))
      .filter(predicate => this.excludedFilter(predicate))
      .sortBy(predicate => this.localizedLabelAsLower(predicate))
      .value();
  }

  selectItem(predicate: PredicateListItem) {
    this.$scope.form.editing = false;
    this.submitError = null;
    this.predicateService.getPredicate(predicate.id).then(result => this.selectedPredicate = result);
  }

  usePredicate() {
    this.$uibModalInstance.close(this.selectedPredicate);
  }

  createAndUsePredicate() {
    return this.predicateService.createPredicate(this.selectedPredicate)
      .then(() => this.usePredicate(), err => this.submitError = err.data.errorMessage);
  }

  createNew(type: Type) {
    return this.searchConceptModal.openNewCreation(this.model.references, type)
      .then(result => {
        if (!this.typeSelectable) {
          this.$uibModalInstance.close(result);
        } else {
          this.predicateService.newPredicate(this.model, result.label, result.concept.id, type, this.languageService.modelLanguage)
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
    return !this.modelId || predicate.definedBy.id === this.modelId;
  }

  private typeFilter(predicate: PredicateListItem): boolean {
    return !this.type || predicate.normalizedType === this.type;
  }

  private excludedFilter(predicate: PredicateListItem): boolean {
    return this.showExcluded || !this.exclude(predicate);
  }
}
