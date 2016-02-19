import * as _ from 'lodash';
import { ClassService } from '../../services/classService';
import { LanguageService } from '../../services/languageService';
import { LocationService } from '../../services/locationService';
import { ModelService } from '../../services/modelService';
import { PredicateService } from '../../services/predicateService';
import { UserService } from '../../services/userService';
import {
  glyphIconClassForType,
  collectIds,
  isDifferentUrl,
  createExistsExclusion,
  createDefinedByExclusion,
  combineExclusions,
  createClassTypeExclusion,
  SearchClassType,
  isModalCancel
} from '../../services/utils';
import {
  Class,
  Predicate,
  PredicateListItem,
  ClassListItem,
  Model,
  Type,
  Property,
  Uri,
  DefinedBy,
  Curie
} from '../../services/entities';
import { ConfirmationModal } from '../common/confirmationModal';
import { SearchClassModal } from '../editor/searchClassModal';
import { SearchPredicateModal } from '../editor/searchPredicateModal';
import { ConceptCreation, isConceptCreation } from '../editor/searchConceptModal';
import { AddPropertiesFromClassModal } from '../editor/addPropertiesFromClassModal';
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import ILocationService = angular.ILocationService;
import IRouteParamsService = angular.route.IRouteParamsService;
import IQService = angular.IQService;
import { config } from '../../config';

export const mod = angular.module('iow.components.model');

mod.directive('model', () => {
  return {
    restrict: 'E',
    template: require('./model.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ModelController
  }
});

export class ModelController {

  loading = true;
  firstLoading = true;
  views: View[] = [];
  selectedItem: WithIdAndType;
  model: Model;
  selection: Class|Predicate;
  classes: SelectableItem[] = [];
  associations: SelectableItem[] = [];
  attributes: SelectableItem[] = [];

  private selectableComparison: (lhs: SelectableItem, rhs: SelectableItem) => number;

  tabs = [
    new Tab('class', () => this.classes, this),
    new Tab('attribute', () => this.attributes, this),
    new Tab('association', () => this.associations, this)
  ];

  /* @ngInject */
  constructor(private $scope: IScope,
              private $location: ILocationService,
              private $routeParams: IRouteParamsService,
              private $q: IQService,
              private locationService: LocationService,
              private modelService: ModelService,
              private classService: ClassService,
              private predicateService: PredicateService,
              private userService: UserService,
              private searchClassModal: SearchClassModal,
              private searchPredicateModal: SearchPredicateModal,
              private confirmationModal: ConfirmationModal,
              private addPropertiesFromClassModal: AddPropertiesFromClassModal,
              public languageService: LanguageService) {

    this.selectableComparison = languageService.localizableComparison((item: SelectableItem) => item.item.label);
    this.init(new RouteData($routeParams));

    $scope.$on('$locationChangeSuccess', () => {
      if ($location.path() === '/model') {
        this.init(new RouteData($location.search()));
      }
    });

    $scope.$on('$locationChangeStart', (event, next, current) => {
      if ((this.selection && !this.selection.unsaved) && isDifferentUrl(current, next)) {
        this.ifEditing(() => event.preventDefault(), () => {
          $location.url($location.url(next).hash());
        });
      }
    });

    $scope.$watch(() => this.model, (newModel: Model, oldModel: Model) => {
      this.updateLocation();

      // new model creation cancelled
      if (oldModel && !newModel) {
        $location.path('/group');
        $location.search({urn: oldModel.groupId});
      }
    });

    $scope.$watch(() => this.selection, () => this.updateLocation());
    $scope.$watch(() => this.languageService.modelLanguage, lang => this.sortAll());
  }

  sortAll() {
    this.sortClasses();
    this.sortPredicates();
  }

  sortClasses() {
    this.classes.sort(this.selectableComparison);
    setOverlaps(this.classes);
  }

  sortPredicates() {
    this.associations.sort(this.selectableComparison);
    this.attributes.sort(this.selectableComparison);
    setOverlaps(this.associations);
    setOverlaps(this.attributes);
  }

  init(routeData: RouteData) {
    this.loading = true;

    if (routeData.selected) {
      _.find(this.tabs, tab => tab.type === routeData.selected.selectionType).active = true;
    }

    this.selectedItem = routeData.selected;

    if (routeData.newModel) {
      this.updateNewModel(routeData.newModel)
        .then(() => this.loading = false);
    } else {
      this.updateModelById(routeData.existingModelId).then(updated => {
          if (updated) {
            this.updateSelectables();
          }
          if (!this.selectedItem && this.model.rootClass) {
            this.selectedItem = { id: this.model.rootClassUri, selectionType: 'class' };
          }
        })
        .then(() => this.updateSelectionByTypeAndId(this.selectedItem))
        .then(() => {
          this.loading = false;
          this.firstLoading = false;
        });
    }
  }

  getRequiredModels(): Set<Uri> {
    type WithDefinedBy = { definedBy: DefinedBy };
    return new Set<Uri>(_.chain<WithDefinedBy>(this.associations)
                         .concat(this.attributes)
                         .concat(this.classes)
                         .filter(item => item && item.definedBy)
                         .map(item => item.definedBy.id)
                         .value());
  }

  registerView(view: View) {
    this.views.push(view);
  }

  isSelected(selection: SelectableItem) {
    return selection.matchesIdentity(this.selectedItem);
  }

  private selectionQueue: SelectableItem[] = [];

  select(listItem: SelectableItem) {

    const fetchUntilStable: ((selection: SelectableItem) => IPromise<Class|Predicate>) = item => {
      return this.fetchEntityByTypeAndId(item).then((entity: Class|Predicate) => {
        const last = this.selectionQueue[this.selectionQueue.length - 1];
        if (last.matchesIdentity(entity)) {
          return entity;
        } else {
          return fetchUntilStable(last);
        }
      });
    };

    this.askPermissionWhenEditing(() => {
      this.selectedItem = listItem;
      if (this.selectionQueue.length > 0) {
        this.selectionQueue.push(listItem);
      } else {
        this.selectionQueue.push(listItem);
        fetchUntilStable(listItem).then((selection: Class|Predicate) => {
          this.selectionQueue = [];
          this.updateSelection(selection);
        });
      }
    });
  }

  selectionEdited(oldSelection: Class|Predicate, newSelection: Class|Predicate) {
    this.updateSelectables();
  }

  canEdit(): boolean {
    return this.model && this.userService.user.isMemberOf(this.model);
  }

  selectionDeleted(selection: Class|Predicate) {
    _.remove(this.classes, item => matchesIdentity(item, selection));
    _.remove(this.attributes, item => matchesIdentity(item, selection));
    _.remove(this.associations, item => matchesIdentity(item, selection));
  }

  private updateLocation() {
    if (!this.loading && this.model) {
      this.locationService.atModel(this.model, this.selection);

      if (!this.model.unsaved) {
        const newSearch: any = {urn: this.model.id};
        if (this.selection) {
          newSearch[this.selection.selectionType] = this.selection.id;
        }

        const search = _.clone(this.$location.search());
        delete search.property;

        if (!_.isEqual(search, newSearch)) {
          this.$location.search(newSearch);
        }
      }
    }
  }

  public addEntity(type: Type) {
    const isProfile = this.model.isOfType('profile');
    const definedExclusion = createDefinedByExclusion(this.model);
    const classExistsExclusion = createExistsExclusion(collectIds(this.classes));
    const predicateExistsExclusion = createExistsExclusion(collectIds([this.attributes, this.associations]));
    const classTypeExclusion = createClassTypeExclusion(SearchClassType.Class);
    const textForSelection = (klass: Class) =>
      isProfile
        ? 'Specialize class'
        : klass && klass.isSpecializedClass()
          ? 'Generalize class'
          : 'Use class';

    const classExclusion = (klass: ClassListItem) => {
      if (isProfile) {
        return classTypeExclusion(klass) || definedExclusion(klass);
      } else {
        if (config.development && klass.isSpecializedClass() && !klass.isOfType('shape')) {
          return <string> null;
        } else {
          return classExistsExclusion(klass) || classTypeExclusion(klass) || definedExclusion(klass);
        }
      }
    };

    const predicateExclusion = combineExclusions<PredicateListItem>(predicateExistsExclusion, definedExclusion);

    if (type === 'class') {
      this.createOrAssignEntity(
        () => this.searchClassModal.open(this.model, classExclusion, textForSelection),
        (concept: ConceptCreation) => this.createClass(concept),
        (klass: Class) => {
          if (isProfile) {
            return this.createShape(klass);
          } else {
            if (klass.isSpecializedClass()) {
              return this.generalizeClass(klass);
            } else {
              return this.assignClassToModel(klass).then(() => klass);
            }
          }
        }
      );
    } else {
      this.createOrAssignEntity(
        () => this.searchPredicateModal.open(this.model, type, predicateExclusion),
        (concept: ConceptCreation) => this.createPredicate(concept),
        (predicate: Predicate) => this.assignPredicateToModel(predicate.id).then(() => predicate)
      );
    }
  }

  private createOrAssignEntity<T extends Class|Predicate>(modal: () => IPromise<ConceptCreation|T>, fromConcept: (concept: ConceptCreation) => IPromise<T>, fromEntity: (entity: T) => IPromise<any>) {
    this.userService.ifStillLoggedIn(() => {
      this.askPermissionWhenEditing(() => {
        modal().then(result => {
          (isConceptCreation(result) ? fromConcept(result) : fromEntity(result))
            .then(entity => {
              this.updateSelection(entity);
              if (!entity.unsaved) {
                this.updateSelectables();
              }
            });
        });
      });
    });
  }

  private createClass(conceptCreation: ConceptCreation) {
    return this.classService.newClass(this.model, conceptCreation.label, conceptCreation.concept.id, this.languageService.modelLanguage);
  }

  private generalizeClass(klass: Class) {
    const exclude = (property: Property) => {
      const namespace = property.expandCurie(property.predicateCurie).namespace;
      return !this.model.findModelPrefixForNamespace(namespace);
    };
    return this.addPropertiesFromClassModal.open(klass, 'profile', exclude)
      .then(properties => {
        const generalized = klass.generalize(this.model, properties);
        this.assignMissingPredicates(generalized);
        return generalized;
      }, err => {
        if (isModalCancel(err)) {
          return klass.generalize(this.model, []);
        }
      });
  }

  private createShape(klass: Class) {
    this.assignMissingPredicates(klass);
    return this.classService.newShape(klass.id, this.model, this.languageService.modelLanguage);
  }

  private assignClassToModel(klass: Class) {
    this.assignMissingPredicates(klass);
    return this.classService.assignClassToModel(klass.id, this.model.id);
  }

  private assignMissingPredicates(klass: Class) {
    const predicateIds = collectIds([this.attributes, this.associations]);

    this.$q.all(
      _.chain(klass.properties)
        .map((property: Property) => property.predicateId)
        .filter((predicateId: Uri) => !predicateIds.has(predicateId))
        .map((predicateId: Uri) => this.assignPredicateToModel(predicateId))
        .value()
      )
      .then(() => this.updatePredicates());
  }

  private createPredicate(conceptCreation: ConceptCreation) {
    return this.predicateService.newPredicate(this.model, conceptCreation.label, conceptCreation.concept.id, conceptCreation.type, this.languageService.modelLanguage)
  }

  private assignPredicateToModel(id: Uri) {
    return this.predicateService.assignPredicateToModel(id, this.model.id);
  }

  private findEditingViews() {
    return _.filter(this.views, view => view.isEditing());
  }

  private confirmThenCancelEditing(editingViews: View[], callback: () => void) {
    this.confirmationModal.openEditInProgress().then(() => {
      _.forEach(editingViews, view => view.cancelEditing());
      callback();
    });
  }

  private ifEditing(synchronousCallback: () => void, confirmedCallback: () => void) {
    const editingViews = this.findEditingViews();

    if (editingViews.length > 0) {
      synchronousCallback();
      this.confirmThenCancelEditing(editingViews, confirmedCallback);
    }
  }

  private askPermissionWhenEditing(callback: () => void) {
    const editingViews = this.findEditingViews();

    if (editingViews.length > 0) {
      this.confirmThenCancelEditing(editingViews, callback);
    } else {
      callback();
    }
  }

  private updateSelectionByTypeAndId(selection: WithIdAndType) {
    if (selection) {
      return this.fetchEntityByTypeAndId(selection)
        .then(entity => this.updateSelection(entity), err => this.updateSelection(null));
    } else {
      return this.updateSelection(null);
    }
  }

  private fetchEntityByTypeAndId(selection: WithIdAndType): IPromise<Class|Predicate> {
    if (!this.selection || !matchesIdentity(this.selection, selection)) {
      return selection.selectionType === 'class'
        ? this.classService.getClass(selection.id)
        : this.predicateService.getPredicate(selection.id);
    } else {
      return this.$q.when(this.selection);
    }
  }

  private updateSelection(selection: Class|Predicate) {
    return this.$q.when(this.selection = selection);
  }

  private updateModelById(modelId: Uri) {
    if (!this.model || this.model.id !== modelId) {
      return this.modelService.getModelByUrn(modelId)
        .then(model => this.updateModel(model))
        .then(model => true);
    } else {
      return this.$q.when(false);
    }
  }

  private updateNewModel(newModel: {prefix: string, label: string, groupId: Uri, type: Type}) {
    return this.modelService.newModel(newModel.prefix, newModel.label, newModel.groupId, this.languageService.modelLanguage, newModel.type)
      .then(model => this.updateModel(model));
  }

  private updateModel(model: Model) {
    return this.$q.when(this.model = model);
  }

  private updateSelectables(): IPromise<any> {
    return this.$q.all([this.updateClasses(), this.updatePredicates()]);
  }

  private updateClasses(): IPromise<any> {
    return this.classService.getClassesForModel(this.model.id).then(classes => {
      this.classes = _.map(classes, klass => new SelectableItem(klass, this));
      this.sortClasses();
    });
  }

  private updatePredicates(): IPromise<any> {
    return this.predicateService.getPredicatesForModel(this.model.id).then(predicates => {
      this.attributes = _.chain(predicates).filter(predicate => predicate.isOfType('attribute')).map(attribute => new SelectableItem(attribute, this)).value();
      this.associations = _.chain(predicates).filter(predicate => predicate.isOfType('association')).map(association => new SelectableItem(association, this)).value();
      this.sortPredicates();
    });
  }
}

class RouteData {

  existingModelId: Uri;

  constructor(private params: any) {
    this.existingModelId = params.urn;
  }

  get newModel() {
    if (this.params.label && this.params.prefix && this.params.group && this.params.type) {
      return {label: this.params.label, prefix: this.params.prefix, groupId: this.params.group, type: this.params.type};
    }
  }

  get selected() {
    for (const type of <Type[]> ['attribute', 'class', 'association']) {
      const id: Uri = this.params[type];
      if (id) {
        return {selectionType: type, id};
      }
    }
  }
}

class Tab {

  addLabel: string;
  glyphIconClass: any;
  active: boolean;
  addNew: () => void;

  constructor(public type: Type, public items: () => SelectableItem[], modelController: ModelController) {
    this.addLabel = 'Add ' + type;
    this.glyphIconClass = glyphIconClassForType([type]);
    this.addNew = () => modelController.addEntity(type);
  }
}

interface View {
  isEditing(): boolean;
  cancelEditing(): void;
}

interface WithIdAndType {
  id: Uri,
  selectionType: Type
}

function matchesIdentity(lhs: SelectableItem|Class|Predicate|WithIdAndType, rhs: SelectableItem|Class|Predicate|WithIdAndType) {
  if ((lhs && !rhs) || (rhs && !lhs)) {
    return false;
  }

  return lhs.selectionType === rhs.selectionType && lhs.id === rhs.id;
}

function setOverlaps(items: SelectableItem[]) {
  let previous: SelectableItem;
  for (const item of items) {
    if (previous && previous.rawLabel === item.rawLabel) {
      previous.hasOverlap = true;
      item.hasOverlap = true;
    } else {
      item.hasOverlap = false;
    }
    previous = item;
  }
}

class SelectableItem {

  hasOverlap = false;
  curie: Curie;

  constructor(public item: ClassListItem|PredicateListItem, private modelController: ModelController) {
    this.curie = this.modelController.model.idToCurie(this.id);
  }

  get id(): Uri {
    return this.item.id;
  }

  get rawLabel(): string {
    return this.modelController.languageService.translate(this.item.label);
  }

  get label(): string {
    return this.rawLabel + (this.hasOverlap ? ` (${this.curie})` : '');
  }

  get definedBy() {
    return this.item.definedBy;
  }

  get selectionType() {
    return this.item.selectionType;
  }

  matchesIdentity(obj: SelectableItem|Class|Predicate|WithIdAndType) {
    return matchesIdentity(this.item, obj);
  }
}