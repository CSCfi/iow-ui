import IPromise = angular.IPromise;
import IScope = angular.IScope;
import ILocationService = angular.ILocationService;
import IRouteService = angular.route.IRouteService;
import ICurrentRoute = angular.route.ICurrentRoute;
import IQService = angular.IQService;
import IWindowService = angular.IWindowService;
import * as _ from 'lodash';
import { ClassService } from '../../services/classService';
import { LanguageService, Localizer } from '../../services/languageService';
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
  AbstractPredicate,
  SelectionType
} from '../../services/entities';
import { ConfirmationModal } from '../common/confirmationModal';
import { SearchClassModal } from '../editor/searchClassModal';
import { SearchPredicateModal } from '../editor/searchPredicateModal';
import { EntityCreation } from '../editor/searchConceptModal';
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
import { SessionService } from '../../services/sessionService';
import { isDefined, areEqual } from '../../utils/object';

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

  loading = true;
  views: View[] = [];
  changeListeners: ChangeListener<Class|Predicate>[] = [];
  selectedItem: WithIdAndType;
  model: Model;
  selection: Class|Predicate;
  openPropertyId: string;
  classes: SelectableItem[] = [];
  associations: SelectableItem[] = [];
  attributes: SelectableItem[] = [];
  selectionWidth: number;
  private _show: Show;

  activeTab = 0;
  tabs = [
    new Tab('class', () => this.classes, this),
    new Tab('attribute', () => this.attributes, this),
    new Tab('association', () => this.associations, this)
  ];

  private localizerProvider: () => Localizer;

  private initialRoute: ICurrentRoute;
  private currentRouteParams: any;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $location: ILocationService,
              private $route: IRouteService,
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

    this.localizerProvider = () => languageService.createLocalizer(this.model);
    this._show = sessionService.show;

    this.initialRoute = $route.current;
    this.currentRouteParams = this.initialRoute.params;

    this.init(new RouteData(this.currentRouteParams));

    $scope.$on('$locationChangeSuccess', () => {
      if ($location.path().startsWith('/model')) {
        this.init(new RouteData($route.current.params));

        // FIXME: hack to prevent reload on params update
        // https://github.com/angular/angular.js/issues/1699#issuecomment-45048054
        // TODO: consider migration to angular-ui-router if it fixes the problem elegantly (https://ui-router.github.io/ng1/)
        this.currentRouteParams = $route.current.params;
        $route.current = this.initialRoute;
      }
    });

    $scope.$on('$locationChangeStart', (event, next, current) => {
      if ((this.selection && !this.selection.unsaved) && isDifferentUrl(current, next, true)) {
        this.ifEditing(() => event.preventDefault(), () => {
          $location.url($location.url(next).hash());
        });
      }
    });

    $scope.$watch(() => this.model, (newModel: Model, oldModel: Model) => {
      if (oldModel && !newModel) { // model removed
        $location.url(oldModel.group.iowUrl());
      }
    });

    $scope.$watch(() => this.selection, (selection, oldSelection) => {

      this.alignTabWithSelection();

      if (!matchesIdentity(selection, oldSelection)) {
        if (oldSelection) {
          this.openPropertyId = undefined;
        }
        this.updateLocation();
      }

      if (!selection) {
        this._show = Show.Visualization;
      } else if (!oldSelection) {
        this._show = this.sessionService.show !== Show.Visualization ? this.sessionService.show : Show.Both;
      }
    });

    $scope.$watch(() => this.model && this.languageService.getModelLanguage(this.model), () => {
      if (this.model) {
        this.sortAll();
      }
    });

    $scope.$watch(() => this.show, show => {
      for (const changeListener of this.changeListeners) {
        changeListener.onResize(show);
      }
    });

    $scope.$watch(() => $route.current.params.property, propertyId => this.openPropertyId = propertyId);
    $scope.$watch(() => this.openPropertyId, propertyId => {
      if (this.currentRouteParams.property !== propertyId) {
        this.updateLocation();
      }
    });
  }

  private init(routeData: RouteData) {

    const modelChanged = !this.model || this.model.prefix !== routeData.existingModelPrefix;
    const selectionChanged = !areEqual((this.selection && this.selection.id.curie), routeData.resourceCurie);

    this.openPropertyId = routeData.propertyId;

    if (modelChanged) {
      this.loading = true;

      this.updateModelByPrefix(routeData.existingModelPrefix)
        .then(() => this.$q.all([this.selectRouteOrDefault(routeData), this.updateSelectables(false)]))
        .then(() => this.updateLocation())
        .then(() => this.loading = false);

    } else if (selectionChanged) {
      this.selectRouteOrDefault(routeData)
        .then(() => this.updateLocation());
    }
  }

  private updateLocation() {

    if (this.model) {
      this.locationService.atModel(this.model, this.selection);

      const newParams: any = { prefix: this.model.prefix };

      if (this.selection) {
        newParams.resource = this.selection.id.namespace === this.model.namespace
          ? this.selection.id.name
          : this.selection.id.curie;
      } else {
        newParams.resource = undefined;
      }

      newParams.property = this.openPropertyId;

      if (!areEqual(newParams.prefix, this.currentRouteParams.prefix)
        || !areEqual(newParams.resource, this.currentRouteParams.resource)
        || !areEqual(newParams.property, this.currentRouteParams.property)) {

        this.$route.updateParams(newParams);
      }
    }
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
    return comparingLocalizable<SelectableItem>(this.localizerProvider(), selectableItem => selectableItem.item.label);
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

  select(item: SelectableItem) {
    this.askPermissionWhenEditing(() => {
      this.updateSelectionByTypeAndId(item);
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

    const that = this;

    function rootClassSelection(): WithIdAndType {
      return that.model.rootClass ? { id: that.model.rootClass, selectionType: 'class' } : null;
    }

    function getRouteSelection(): IPromise<WithIdAndType> {

      if (routeData.resourceCurie) {
        const resourceUri = new Uri(routeData.resourceCurie, that.model.context);
        const startsWithCapital = /^([A-Z]).*/.test(resourceUri.name);
        const selectionType: SelectionType = startsWithCapital ? 'class' : 'predicate';

        if (resourceUri.namespaceResolves()) {
          return that.$q.resolve({
            id: resourceUri,
            selectionType
          });
        } else {
          return that.modelService.getModelByPrefix(resourceUri.findPrefix()).then(model => {
            return {
              id: new Uri(routeData.resourceCurie, model.context),
              selectionType
            };
          });
        }
      } else {
        return that.$q.when(null);
      }
    };

    return getRouteSelection()
      .then(selectionFromRoute => {
        const selection = selectionFromRoute || rootClassSelection();

        if (!matchesIdentity(this.selection, selection)) {
          return this.updateSelectionByTypeAndId(selection);
        } else {
          return this.$q.resolve();
        }
      });
  }

  // TODO remove retrying when data is coherent
  private updateSelectionByTypeAndId(selection: WithIdAndType, isRetry: boolean = false): IPromise<any> {

    // set selected item also here for showing selection before entity actually is loaded
    this.selectedItem = selection;

    if (selection) {
      return this.fetchEntityByTypeAndId(selection)
        .then(entity => {
          if (!entity && !isRetry) {
            return this.updateSelectionByTypeAndId({
              id: selection.id,
              selectionType: selection.selectionType === 'class' ? 'predicate' : 'class'
            }, true);
          } else {
            return this.updateSelection(entity);
          }
        });
    } else {
      return this.$q.when(this.updateSelection(null));
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

  private alignTabWithSelection() {

    const tabType = this.selection instanceof Predicate ? this.selection.normalizedType : 'class';

    for (let i = 0; i < this.tabs.length; i++) {
      if (this.tabs[i].type === tabType) {
        this.activeTab = i;
        break;
      }
    }
  }

  private updateSelection(selection: Class|Predicate) {
    this.selectedItem = selection;
    this.selection = selection;
  }

  private updateModelByPrefix(prefix: string) {
    return this.modelService.getModelByPrefix(prefix)
      .then(model => this.model = model)
      .then(model => true, err => this.maintenanceModal.open(err));
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
    return this.show === Show.Visualization ? 'hide' : '';
  }

  styleForSelection() {
    return {
      'padding-left': '5px',
      width: this.show === Show.Both ? `${this.selectionWidth + 5}px` : '100%'
    };
  }

  classForVisualization() {
    return this.show === Show.Selection ? 'hide' : '';
  }

  styleForVisualization() {
    return {
      'padding-left': this.show === Show.Visualization ? '5px' : 0,
      width: this.show === Show.Both ? `calc(100% - ${this.selectionWidth + 10}px)` : '100%'
    };
  }
}


class RouteData {

  existingModelPrefix: string;
  resourceCurie: string;
  propertyId: string;

  constructor(private params: any) {
    this.existingModelPrefix = params.prefix;

    if (params.resource) {
      const split = params.resource.split(':');

      if (split.length === 1) {
        this.resourceCurie = params.prefix + ':' + params.resource;
      } else if (split.length === 2) {
        this.resourceCurie = params.resource;
      } else {
        throw new Error('Unsupported resource format: ' + params.resource);
      }

      if (params.property) {
        this.propertyId = params.property;
      }
    }
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
  selectionType: SelectionType;
}

function matchesIdentity(lhs: WithIdAndType, rhs: WithIdAndType) {
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

  matchesIdentity(obj: WithIdAndType) {
    return matchesIdentity(this.item, obj);
  }
}
