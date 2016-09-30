import { IPromise, IScope, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import {
  Predicate, PredicateListItem, Model, Type, DefinedBy,
  AbstractPredicate, ExternalEntity, Property, Class
} from '../../services/entities';
import { PredicateService } from '../../services/predicateService';
import { SearchConceptModal, EntityCreation } from './searchConceptModal';
import { LanguageService, Localizer } from '../../services/languageService';
import { EditableForm } from '../form/editableEntityController';
import { comparingBoolean, comparingLocalizable } from '../../services/comparators';
import { AddNew } from '../common/searchResults';
import { collectIds, glyphIconClassForType } from '../../utils/entity';
import { ChoosePredicateTypeModal } from './choosePredicateTypeModal';
import { ClassService } from '../../services/classService';
import { collectProperties, any } from '../../utils/array';
import { createExistsExclusion, createDefinedByExclusion, combineExclusions } from '../../utils/exclusion';
import { valueContains } from '../../utils/searchFilter';

const noExclude = (_item: PredicateListItem) => <string> null;

export class SearchPredicateModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService,
              private choosePredicateTypeModal: ChoosePredicateTypeModal,
              private classService: ClassService) {
  }

  private openModal(model: Model, type: Type, exclude: (predicate: AbstractPredicate) => string, onlySelection: boolean) {
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

  openAddPredicate(model: Model, type: Type, exclude: (predicate: AbstractPredicate) => string = noExclude): IPromise<ExternalEntity|EntityCreation|Predicate> {
    return this.openModal(model, type, exclude, false);
  }

  openForProperty(model: Model, exclude: (predicate: AbstractPredicate) => string = noExclude): IPromise<ExternalEntity|Predicate> {
    return this.openModal(model, null, exclude, false);
  }

  openAddProperty(model: Model, klass: Class): IPromise<Property> {

    const exclude = combineExclusions<PredicateListItem>(
      createExistsExclusion(collectProperties(_.filter(klass.properties, p => p.isAttribute()), p => p.predicateId.uri)),
      createDefinedByExclusion(model)
    );

    return this.openForProperty(model, exclude).then(predicate => {
      if (predicate instanceof Predicate && predicate.normalizedType === 'property') {
        return this.choosePredicateTypeModal.open().then(type => {
          return this.classService.newProperty(predicate, type, model);
        });
      } else {
        return this.classService.newProperty(predicate, predicate.normalizedType, model);
      }
    });
  }

  openWithOnlySelection(model: Model, type: Type, exclude: (predicate: AbstractPredicate) => string = noExclude): IPromise<Predicate> {
    return this.openModal(model, type, exclude, true);
  }
}

export interface SearchPredicateScope extends IScope {
  form: EditableForm;
}

export class SearchPredicateController {

  private predicates: PredicateListItem[] = [];
  private currentModelPredicateIds: Set<string> = new Set<string>();

  editInProgress = () => this.$scope.form.editing && this.$scope.form.$dirty;
  close = this.$uibModalInstance.dismiss;
  searchResults: (PredicateListItem|AddNewPredicate)[] = [];
  selection: Predicate|ExternalEntity;
  searchText: string = '';
  showModel: DefinedBy|Model;
  models: (DefinedBy|Model)[] = [];
  types: Type[];
  typeSelectable: boolean;
  excludeError: string;
  cannotConfirm: string;
  loadingResults: boolean;
  selectedItem: PredicateListItem|AddNewPredicate;

  // undefined means not fetched, null means does not exist
  externalPredicate: Predicate;

  private localizer: Localizer;

  contentMatchers = [
    { name: 'Label', extractor: (predicate: PredicateListItem) => predicate.label },
    { name: 'Description', extractor: (predicate: PredicateListItem) => predicate.comment },
    { name: 'Identifier', extractor: (predicate: PredicateListItem) => predicate.id.compact }
  ];

  contentExtractors = this.contentMatchers.map(m => m.extractor);

  /* @ngInject */
  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              public model: Model,
              public type: Type,
              public exclude: (predicate: AbstractPredicate) => string,
              public onlySelection: boolean,
              private predicateService: PredicateService,
              languageService: LanguageService,
              private searchConceptModal: SearchConceptModal,
              private gettextCatalog: gettextCatalog) {

    this.localizer = languageService.createLocalizer(model);
    this.loadingResults = true;
    this.typeSelectable = !type;

    const appendResults = (predicates: PredicateListItem[]) => {
      this.predicates = this.predicates.concat(predicates);

      const definedByFromPredicates = _.chain(this.predicates)
        .map(predicate => predicate.definedBy)
        .uniqBy(definedBy => definedBy.id.uri)
        .value()
        .sort(comparingLocalizable<DefinedBy>(this.localizer, definedBy => definedBy.label));

      this.models = [this.model, ...definedByFromPredicates];

      this.types = _.chain(this.predicates)
        .map(predicate => predicate.normalizedType)
        .uniq()
        .value();

      this.search();

      this.loadingResults = false;
    };

    predicateService.getAllPredicates(model).then(appendResults);
    predicateService.getPredicatesAssignedToModel(model)
      .then(predicates => this.currentModelPredicateIds = collectIds(predicates))
      .then(() => this.search());

    if (this.canAddExternal()) {
      predicateService.getExternalPredicatesForModel(model).then(appendResults);
    }

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.type, () => this.search());
    $scope.$watch(() => this.showModel, () => this.search());
    $scope.$watchCollection(() => this.contentExtractors, () => this.search());

    $scope.$watch(() => this.selection && this.selection.id, selectionId => {
      if (selectionId && this.selection instanceof ExternalEntity) {
        this.externalPredicate = undefined;
        predicateService.getExternalPredicate(selectionId, model).then(predicate => this.externalPredicate = predicate);
      }
    });
  }

  isThisModel(item: DefinedBy|Model) {
    return this.model === item;
  }

  canAddExternal() {
    return this.model.isOfType('profile');
  }

  get showExcluded() {
    return !!this.searchText;
  }

  isSelectionExternalEntity(): boolean {
    return this.selection instanceof ExternalEntity;
  }

  isSelectionPredicate(): boolean {
    return this.selection instanceof Predicate;
  }

  search() {
    const result: (PredicateListItem|AddNewPredicate)[] = [
      new AddNewPredicate(`${this.gettextCatalog.getString('Create new attribute')} '${this.searchText}'`, this.isAttributeAddable.bind(this), 'attribute', false),
      new AddNewPredicate(`${this.gettextCatalog.getString('Create new association')} '${this.searchText}'`, this.isAssociationAddable.bind(this), 'association', false),
      new AddNewPredicate(`${this.gettextCatalog.getString('Create new predicate')} ${this.gettextCatalog.getString('by referencing external uri')}`, () => this.canAddExternal(), null, true)
    ];

    const predicateSearchResult = this.predicates.filter(predicate =>
      this.textFilter(predicate) &&
      this.modelFilter(predicate) &&
      this.typeFilter(predicate) &&
      this.excludedFilter(predicate)
    );

    predicateSearchResult.sort(
      comparingBoolean<PredicateListItem>(item => !!this.exclude(item))
        .andThen(comparingLocalizable<PredicateListItem>(this.localizer, item => item.label)));

    this.searchResults = result.concat(predicateSearchResult);
  }

  selectItem(item: PredicateListItem|AddNewPredicate) {
    this.selectedItem = item;
    this.externalPredicate = undefined;
    this.excludeError = null;
    this.$scope.form.editing = false;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewPredicate) {
      if (item.external) {
        this.$scope.form.editing = true;
        this.selection = new ExternalEntity(this.localizer.language, this.searchText, this.type || 'attribute');
      } else {
        this.createNew(item.type);
      }
    } else if (item instanceof PredicateListItem) {
      this.cannotConfirm = this.exclude(item);

      if (this.model.isNamespaceKnownToBeNotModel(item.definedBy.id.url)) {
        this.predicateService.getExternalPredicate(item.id, this.model).then(result => this.selection = result);
      } else {
        this.predicateService.getPredicate(item.id, this.model).then(result => this.selection = result);
      }
    } else {
      throw new Error('Unsupported item: ' + item);
    }
  }

  loadingSelection(item: PredicateListItem|AddNew) {
    const selection = this.selection;
    if (item instanceof PredicateListItem) {
      return item === this.selectedItem && (!selection || (selection instanceof Predicate && !item.id.equals(selection.id)));
    } else {
      return false;
    }
  }

  isExternalPredicatePending() {
    return this.isSelectionExternalEntity() && this.externalPredicate === undefined;
  }

  confirm() {
    const selection = this.selection;

    if (selection instanceof Predicate) {
      if (selection.unsaved) {
        this.predicateService.createPredicate(selection)
          .then(() => this.$uibModalInstance.close(selection), err => this.excludeError = err.data.errorMessage);
      } else {
        this.$uibModalInstance.close(selection);
      }
    } else if (selection instanceof ExternalEntity) {
      if (this.externalPredicate) {
        const exclude = this.exclude(this.externalPredicate);
        if (exclude) {
          this.excludeError = exclude;
        } else {
          this.$uibModalInstance.close(this.externalPredicate);
        }
      } else {
        this.$uibModalInstance.close(selection);
      }
    } else {
      throw new Error('Unsupported selection: ' + selection);
    }
  }

  createNew(type: Type) {
    return this.searchConceptModal.openNewEntityCreation(this.model.vocabularies, this.model, type, this.searchText)
      .then(result => {
        if (!this.typeSelectable) {
          this.$uibModalInstance.close(result);
        } else {
          this.predicateService.newPredicate(this.model, result.entity.label, result.concept.id, type, this.localizer.language)
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
    return this.searchText && !this.onlySelection && (this.typeSelectable || this.type === 'attribute');
  }

  isAssociationAddable(): boolean {
    return this.searchText && !this.onlySelection && (this.typeSelectable || this.type === 'association');
  }

  private textFilter(predicate: PredicateListItem): boolean {
    return !this.searchText || any(this.contentExtractors, extractor => valueContains(extractor(predicate), this.searchText));
  }

  private modelFilter(predicate: PredicateListItem): boolean {
    if (!this.showModel) {
      return true;
    } else if (this.showModel === this.model) {
      return this.currentModelPredicateIds.has(predicate.id.uri);
    } else {
      return predicate.definedBy.id.equals(this.showModel.id);
    }
  }

  private typeFilter(predicate: PredicateListItem): boolean {
    return !this.type || predicate.normalizedType === this.type;
  }

  private excludedFilter(predicate: PredicateListItem): boolean {
    return this.showExcluded || !this.exclude(predicate);
  }
}

class AddNewPredicate extends AddNew {
  constructor(public label: string, public show: () => boolean, public type: Type, public external: boolean) {
    super(label, show, glyphIconClassForType([type]));
  }
}
