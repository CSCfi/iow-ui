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

  open(model: Model, type: Type, excludedPredicateMap: Set<Uri>): IPromise<ConceptCreation|Predicate> {
    return this.openModal(model, type, excludedPredicateMap, false);
  }

  openWithPredicationCreation(model: Model): IPromise<Predicate> {
    return this.openModal(model, null, new Set<Uri>(), false);
  }

  openWithOnlySelection(model: Model, type: Type): IPromise<Predicate> {
    return this.openModal(model, type, new Set<Uri>(), true);
  }
};

export interface SearchPredicateScope extends IScope {
  form: EditableForm;
}

export class SearchPredicateController {

  private predicates: PredicateListItem[];

  close = this.$uibModalInstance.dismiss;
  selectedPredicate: Predicate;
  selectedItem: PredicateListItem;
  searchText: string = '';
  modelId: Uri;
  models: ModelListItem[];
  types: Type[];
  typeSelectable: boolean;
  submitError: boolean;

  /* @ngInject */
  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              public model: Model,
              public type: Type,
              private excludedPredicates: Set<Uri>,
              public onlySelection: boolean,
              private predicateService: PredicateService,
              private languageService: LanguageService,
              private searchConceptModal: SearchConceptModal) {

    predicateService.getAllPredicates().then((allPredicates: PredicateListItem[]) => {
      this.typeSelectable = !type;
      this.predicates = _.reject(allPredicates, predicate => excludedPredicates.has(predicate.id));

      this.models = _.chain(this.predicates)
        .map(predicate => predicate.model)
        .uniq(classModel => classModel.id)
        .value();

      this.types = _.chain(this.predicates)
        .map(predicate => predicate.type)
        .uniq()
        .value();
    });
  }

  searchResults(): PredicateListItem[] {
    return _.chain(this.predicates)
      .filter(predicate => this.textFilter(predicate))
      .filter(predicate => this.modelFilter(predicate))
      .filter(predicate => this.typeFilter(predicate))
      .sortBy(predicate => this.localizedLabelAsLower(predicate))
      .value();
  }

  selectPredicate(predicate: PredicateListItem) {
    this.$scope.form.editing = false;
    this.submitError = false;
    this.selectedItem = predicate;
    this.predicateService.getPredicate(predicate.id).then(result => this.selectedPredicate = result);
  }

  isSelected(predicate: PredicateListItem) {
    return predicate === this.selectedItem;
  }

  usePredicate() {
    this.$uibModalInstance.close(this.selectedPredicate);
  }

  createAndUsePredicate() {
    return this.predicateService.createPredicate(this.selectedPredicate)
      .then(() => this.usePredicate(), err => this.submitError = true);
  }

  createNew(selectionOwlType: string) {
    return this.searchConceptModal.openNewCreation(this.model.references, 'predicate')
      .then(result => {
        if (!this.typeSelectable) {
          this.$uibModalInstance.close(_.extend(result, {type: selectionOwlType}));
        } else {
          this.predicateService.newPredicate(this.model, result.label, result.concept.id, selectionOwlType, this.languageService.modelLanguage)
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
}
