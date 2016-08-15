import * as _ from 'lodash';
import { ClassService } from '../../services/classService';
import { LanguageService } from '../../services/languageService';
import { LocationService } from '../../services/locationService';
import { ModelService } from '../../services/modelService';
import { PredicateService } from '../../services/predicateService';
import { UserService } from '../../services/userService';
import {
  Class,
  Predicate,
  PredicateListItem,
  ClassListItem,
  Model,
  Type,
  Property,
  DefinedBy,
  ExternalEntity,
  AbstractClass,
  AbstractPredicate
} from '../../services/entities';
import { ConfirmationModal } from '../common/confirmationModal';
import { SearchClassModal } from '../editor/searchClassModal';
import { SearchPredicateModal } from '../editor/searchPredicateModal';
import { EntityCreation } from '../editor/searchConceptModal';
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import ILocationService = angular.ILocationService;
import IRouteParamsService = angular.route.IRouteParamsService;
import IQService = angular.IQService;
import { MaintenanceModal } from '../maintenance';
import { Show, ChangeNotifier, ChangeListener, SearchClassType } from './../contracts';
import { Uri } from '../../services/uri';
import { comparingLocalizable } from '../../services/comparators';
import { AddPropertiesFromClassModal } from '../editor/addPropertiesFromClassModal';
import { module as mod }  from './module';
import { isDifferentUrl } from '../../utils/angular';
import {
  createClassTypeExclusion, createDefinedByExclusion, combineExclusions,
  createExistsExclusion
} from '../../utils/exclusion';
import { collectIds, glyphIconClassForType } from '../../utils/entity';
import { Language } from '../../utils/language';
import { SessionService } from '../../services/sessionService';
import { isDefined } from '../../utils/object';

mod.directive('model', () => {
  return {
    restrict: 'E',
    template: require('./model.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ModelController
  };
});

export class ModelController implements ChangeNotifier<Class|Predicate> {

  loading: boolean;
  views: View[] = [];
  changeListeners: ChangeListener<Class|Predicate>[] = [];
  selectedItem: WithIdAndType;
  model: Model;
  selection: Class|Predicate;
  classes: SelectableItem[] = [];
  associations: SelectableItem[] = [];
  attributes: SelectableItem[] = [];
  private _show: Show;

  activeTab = 0;
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
              private maintenanceModal: MaintenanceModal,
              private addPropertiesFromClassModal: AddPropertiesFromClassModal,
              private sessionService: SessionService,
              public languageService: LanguageService) {

    this._show = sessionService.show;
    this.init(new RouteData($routeParams));

    $scope.$on('$locationChangeSuccess', (event, next, current) => {
      if ($location.path() === '/model' && isDifferentUrl(next, current)) {
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
      if (!matchesIdentity(newModel, oldModel) || (oldModel && oldModel.unsaved && newModel && !newModel.unsaved)) {
        this.updateLocation();
      }

      // new model creation cancelled
      if (oldModel && !newModel) {
        $location.path('/group');
        $location.search({urn: oldModel.groupId.uri});
      }
    });

    $scope.$watch(() => this.selection, (selection, oldSelection) => {
      if (!matchesIdentity(selection, oldSelection)) {
        this.updateLocation();
      }

      if (!selection) {
        this._show = Show.Visualization;
      } else if (!oldSelection) {
        this._show = this.sessionService.show !== Show.Visualization ? this.sessionService.show : Show.Both;
      }
    });

    $scope.$watch(() => this.languageService.getModelLanguage(this.model), lang => this.sortAll());
    $scope.$watch(() => this.show, show => {
      for (const changeListener of this.changeListeners) {
        changeListener.onResize(show);
      }
    });
  }

  get show() {
    return isDefined(this._show) ? this._show : Show.Both;
  }

  set show(value: Show) {
    this._show = value;
    this.sessionService.show = value;
  }

  addListener(listener: ChangeListener<Class|Predicate>) {
    this.changeListeners.push(listener);
  }

  sortAll() {
    this.sortClasses();
    this.sortPredicates();
  }

  sortClasses() {
    this.classes.sort(this.selectableItemComparator);
    setOverlaps(this.classes);
  }

  sortPredicates() {
    this.associations.sort(this.selectableItemComparator);
    this.attributes.sort(this.selectableItemComparator);
    setOverlaps(this.associations);
    setOverlaps(this.attributes);
  }

  get selectableItemComparator() {
    return comparingLocalizable<SelectableItem>(this.languageService.getModelLanguage(this.model), selectableItem => selectableItem.item.label);
  }

  init(routeData: RouteData) {
    const loadingPromises: IPromise<any>[] = [];

    if (routeData.newModel) {
      loadingPromises.push(this.updateNewModel(routeData.newModel));
    } else {
      if (!this.model || this.model.id.notEquals(routeData.existingModelId)) {
        this.loading = true;
        loadingPromises.push(
          this.updateModelById(routeData.existingModelId)
            .then(updated => {
              const afterModelPromises = [this.selectRouteOrDefault(routeData)];
              if (updated) {
                afterModelPromises.push(this.updateSelectables(false));
              }
              return this.$q.all(afterModelPromises);
            })
        );
      } else {
        loadingPromises.push(this.selectRouteOrDefault(routeData));
      }
    }

    this.$q.all(loadingPromises).then(() => {
      this.loading = false;
      this.updateLocation();
    });
  }

  getUsedNamespaces(): Set<string> {
    type WithDefinedBy = { definedBy: DefinedBy };
    return new Set<string>(_.chain<WithDefinedBy>(this.associations)
                         .concat(this.attributes)
                         .concat(this.classes)
                         .filter(item => item && item.definedBy)
                         .map(item => item.definedBy.id.uri)
                         .value());
  }

  registerView(view: View) {
    this.views.push(view);
  }

  isSelected(selection: SelectableItem) {
    return selection.matchesIdentity(this.selectedItem);
  }

  isLoading(listItem: SelectableItem) {
    return matchesIdentity(listItem, this.selectedItem) && !matchesIdentity(listItem, this.selection);
  }

  select(item: WithIdAndType) {
    this.askPermissionWhenEditing(() => {
      this.selectedItem = item;

      if (item) {
        this.fetchEntityByTypeAndId(item)
          .then(selection => this.selection = selection);
      } else {
        this.selection = null;
      }
    });
  }

  selectionEdited(oldSelection: Class|Predicate, newSelection: Class|Predicate) {
    this.selectedItem = newSelection;
    this.updateSelectables(true);

    for (const changeListener of this.changeListeners) {
      changeListener.onEdit(newSelection, oldSelection);
    }
  }

  canEdit(): boolean {
    return this.model && this.userService.user.isMemberOf(this.model);
  }

  selectionDeleted(selection: Class|Predicate) {
    _.remove(this.classes, item => matchesIdentity(item, selection));
    _.remove(this.attributes, item => matchesIdentity(item, selection));
    _.remove(this.associations, item => matchesIdentity(item, selection));

    for (const changeListener of this.changeListeners) {
      changeListener.onDelete(selection);
    }
  }

  private updateLocation() {
    if (!this.loading && this.model) {
      this.locationService.atModel(this.model, this.selection);

      if (!this.model.unsaved) {
        const newSearch: any = {urn: this.model.id.uri};
        if (this.selection) {
          newSearch[this.selection.selectionType] = this.selection.id.uri;
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
    const classExclusion = combineExclusions<AbstractClass>(createClassTypeExclusion(SearchClassType.Class), createDefinedByExclusion(this.model));
    const predicateExclusion = combineExclusions<AbstractPredicate>(createExistsExclusion(collectIds([this.attributes, this.associations])), createDefinedByExclusion(this.model));

    if (type === 'class') {
      if (isProfile) {
        return this.addClass(classExclusion);
      } else {
        return this.addClass(combineExclusions<AbstractClass>(classExclusion, createExistsExclusion(collectIds(this.classes))));
      }
    } else {
      this.addPredicate(type, predicateExclusion);
    }
  }

  private addClass(exclusion: (klass: AbstractClass) => string) {

    const isProfile = this.model.isOfType('profile');
    const textForSelection = (klass: Class) => isProfile ? 'Specialize class' : 'Use class';

    this.createOrAssignEntity(
      () => this.searchClassModal.open(this.model, exclusion, textForSelection),
      (external: ExternalEntity) => {
        if (isProfile) {
          return this.createShape(external, true);
        } else {
          return this.$q.reject('Library does not support external');
        }
      },
      (concept: EntityCreation) => this.createClass(concept),
      (klass: Class) => {
        if (klass.unsaved) {
          return this.$q.when(klass);
        } else if (isProfile) {
          return this.createShape(klass, klass.external);
        } else {
          return this.assignClassToModel(klass).then(() => klass);
        }
      }
    );
  }

  private addPredicate(type: Type, exclusion: (predicate: AbstractPredicate) => string) {
    this.createOrAssignEntity(
      () => this.searchPredicateModal.open(this.model, type, exclusion),
      (external: ExternalEntity) => this.$q.reject('Unsupported operation'),
      (concept: EntityCreation) => this.createPredicate(concept, type),
      (predicate: Predicate) => this.assignPredicateToModel(predicate.id).then(() => predicate)
    );
  }

  private createOrAssignEntity<T extends Class|Predicate>(modal: () => IPromise<ExternalEntity|EntityCreation|T>,
                                                          fromExternalEntity: (external: ExternalEntity) => IPromise<T>,
                                                          fromConcept: (concept: EntityCreation) => IPromise<T>,
                                                          fromEntity: (entity: T) => IPromise<T>) {
    this.userService.ifStillLoggedIn(() => {
      this.askPermissionWhenEditing(() => {
        modal().then(result => {

          const mapEntity = () => {
            if (result instanceof EntityCreation) {
              return fromConcept(result);
            } else if (result instanceof ExternalEntity) {
              return fromExternalEntity(result);
            } else {
              return fromEntity(<T> result);
            }
          };

          mapEntity().then(entity => {
              this.updateSelection(entity);
              if (!entity.unsaved) {
                this.updateSelectables(true);

                for (const changeListener of this.changeListeners) {
                  changeListener.onAssign(entity);
                }
              }
            });
        });
      });
    });
  }

  private createClass(conceptCreation: EntityCreation) {
    return this.classService.newClass(this.model, conceptCreation.entity.label, conceptCreation.concept.id, this.languageService.getModelLanguage(this.model));
  }

  private createShape(classOrExternal: Class|ExternalEntity, external: boolean) {

    return this.classService.newShape(classOrExternal, this.model, external, this.languageService.getModelLanguage(this.model))
      .then(shape => {
        if (shape.properties.length > 0) {
          return this.$q.all([this.$q.when(shape), this.addPropertiesFromClassModal.open(shape, external ? 'external' : 'scope', this.model)]);
        } else {
          return this.$q.when([shape, shape.properties]);
        }
      })
      .then(([shape, properties]: [Class, Property[]]) => {
        shape.properties = properties;
        return shape;
      });
  }

  private assignClassToModel(klass: Class) {
    return this.classService.assignClassToModel(klass.id, this.model.id);
  }

  private createPredicate(conceptCreation: EntityCreation, type: Type) {
    return this.predicateService.newPredicate(this.model, conceptCreation.entity.label, conceptCreation.concept.id, type, this.languageService.getModelLanguage(this.model));
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

  private selectRouteOrDefault(routeData: RouteData): IPromise<any> {

    function rootClassSelection(model: Model): WithIdAndType {
      return (model && model.rootClass) ? { id: model.rootClass, selectionType: 'class' } : null;
    }

    if (routeData.selected) {
      for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].type === routeData.selected.selectionType) {
          this.activeTab = i;
          break;
        }
      }
    }

    const selection = routeData.selected || rootClassSelection(this.model);

    if (!matchesIdentity(this.selection, selection)) {
      return this.updateSelectionByTypeAndId(selection);
    } else {
      return this.$q.resolve();
    }
  }

  private updateSelectionByTypeAndId(selection: WithIdAndType) {
    this.selectedItem = selection;
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
        ? this.classService.getClass(selection.id, this.model)
        : this.predicateService.getPredicate(selection.id, this.model);
    } else {
      return this.$q.when(this.selection);
    }
  }

  private updateSelection(selection: Class|Predicate) {
    this.selectedItem = selection;
    return this.$q.when(this.selection = selection);
  }

  private updateModelById(modelId: Uri) {
    if (!this.model || this.model.id.notEquals(modelId)) {
      return this.modelService.getModelByUrn(modelId)
        .then(model => this.updateModel(model))
        .then(model => true, err => this.maintenanceModal.open(err));
    } else {
      return this.$q.when(false);
    }
  }

  private updateNewModel(newModel: {prefix: string, label: string, groupId: Uri, language: Language[], type: Type}) {
    return this.modelService.newModel(newModel.prefix, newModel.label, newModel.groupId, newModel.language, newModel.type)
      .then(model => this.updateModel(model));
  }

  private updateModel(model: Model) {
    return this.$q.when(this.model = model);
  }

  private updateSelectables(invalidateCaches: boolean): IPromise<any> {
    return this.$q.all([this.updateClasses(invalidateCaches), this.updatePredicates(invalidateCaches)]);
  }

  private updateClasses(invalidateCaches: boolean): IPromise<any> {
    return this.classService.getClassesForModel(this.model, invalidateCaches)
      .then(classes => {
        this.classes = _.map(classes, klass => new SelectableItem(klass, this));
        this.sortClasses();
      });
  }

  private updatePredicates(invalidateCaches: boolean): IPromise<any> {
    return this.predicateService.getPredicatesForModel(this.model, invalidateCaches)
      .then(predicates => {
        this.attributes = _.chain(predicates)
          .filter(predicate => predicate.isOfType('attribute'))
          .map(attribute => new SelectableItem(attribute, this))
          .value();

        this.associations = _.chain(predicates)
          .filter(predicate => predicate.isOfType('association'))
          .map(association => new SelectableItem(association, this))
          .value();
        this.sortPredicates();
      });
  }

  classForSelection() {
    switch (this.show) {
      case Show.Both:
        return 'col-md-7';
      case Show.Selection:
        return 'col-md-12';
      case Show.Visualization:
        return 'hide';
      default:
        throw new Error('Unsupported show: ' + this.show);
    }
  }

  classForVisualization() {
    switch (this.show) {
      case Show.Both:
        return 'col-md-5';
      case Show.Selection:
        return 'hide';
      case Show.Visualization:
        return 'col-md-12';
      default:
        throw new Error('Unsupported show: ' + this.show);
    }
  }
}

class RouteData {

  existingModelId: Uri;

  constructor(private params: any) {
    if (params.urn) {
      this.existingModelId = new Uri(params.urn);
    }
  }

  get newModel() {
    if (this.params.label && this.params.prefix && this.params.group && this.params.type && this.params.language) {
      return {label: this.params.label, prefix: this.params.prefix, language: this.params.language, groupId: new Uri(this.params.group), type: this.params.type};
    } else {
      return null;
    }
  }

  get selected() {
    for (const type of <Type[]> ['attribute', 'class', 'association']) {
      const id: string = this.params[type];
      if (id) {
        return {selectionType: type, id: new Uri(id)};
      }
    }
    return null;
  }
}

class Tab {

  addLabel: string;
  glyphIconClass: any;
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
  id: Uri;
  selectionType: Type;
}

function matchesIdentity(lhs: SelectableItem|Class|Predicate|WithIdAndType, rhs: SelectableItem|Class|Predicate|WithIdAndType) {
  if (!lhs && !rhs) {
    return true;
  }  else if ((lhs && !rhs) || (rhs && !lhs)) {
    return false;
  } else {
    return lhs.selectionType === rhs.selectionType && lhs.id.equals(rhs.id);
  }
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

  constructor(public item: ClassListItem|PredicateListItem, private modelController: ModelController) {
  }

  get id(): Uri {
    return this.item.id;
  }

  get rawLabel(): string {
    return this.modelController.languageService.translate(this.item.label, this.modelController.model);
  }

  get label(): string {
    return this.rawLabel + (this.hasOverlap ? ` (${this.id.compact})` : '');
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
