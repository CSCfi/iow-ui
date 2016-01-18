import * as _ from 'lodash';
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import ILocationService = angular.ILocationService;
import IRouteParamsService = angular.route.IRouteParamsService;
import IQService = angular.IQService;
import { ClassService } from '../../services/classService';
import { LanguageService } from '../../services/languageService';
import { LocationService } from '../../services/locationService';
import { ModelService } from '../../services/modelService';
import { PredicateService } from '../../services/predicateService';
import { UserService } from '../../services/userService';
import { glyphIconClassForType, collectIds, isDifferentUrl, normalizeSelectionType } from '../../services/utils';
import { Class, Attribute, Predicate, PredicateListItem, ClassListItem, Association, Model, ModelListItem, Type, Concept, ConceptSuggestion, Property, WithIdAndType, Uri, Localizable } from '../../services/entities';
import { ConfirmationModal } from '../common/confirmationModal';
import { SearchClassModal } from '../editor/searchClassModal';
import { SearchPredicateModal } from '../editor/searchPredicateModal';
import { ConceptCreation, isConceptCreation } from '../editor/searchConceptModal';
import { DefinedBy } from '../../services/entities';

export class ModelController {

  loading = true;
  firstLoading = true;
  views: View[] = [];
  selectedItem: WithIdAndType;
  model: Model;
  selection: Class|Predicate;
  classes: ClassListItem[];
  associations: PredicateListItem[];
  attributes: PredicateListItem[];

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
              private languageService: LanguageService) {

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
  }

  init(routeData: RouteData) {
    this.loading = true;

    if (routeData.selected) {
      _.find(this.tabs, tab => tab.type === routeData.selected.type).active = true;
    }

    this.selectedItem = routeData.selected;

    if (routeData.newModel) {
      this.updateNewModel(routeData.newModel)
        .then(() => this.loading = false);
    } else {
      this.$q.all([
          this.updateModelById(routeData.existingModelId).then(updated => {
            if (updated) {
              this.updateSelectables();
            }
          }),
          this.updateSelectionByTypeAndId(routeData.selected)
        ])
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

  isSelected(selection: WithIdAndType) {
    return areEqual(selection, this.selectedItem);
  }

  private selectionQueue: WithIdAndType[] = [];

  select(listItem: WithIdAndType) {
    const fetchUntilStable: ((selection: WithIdAndType) => IPromise<Class|Predicate>) = item => {
      return this.fetchEntityByTypeAndId(item).then((entity: any) => {
        const last = this.selectionQueue[this.selectionQueue.length - 1];
        if (areEqual(entity, last)) {
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

  selectionEdited(oldSelection: WithIdAndType, newSelection: WithIdAndType) {
    this.updateSelectables();
  }

  canEdit(): boolean {
    return this.model && this.userService.user.isMemberOf(this.model);
  }

  selectionDeleted(selection: WithIdAndType) {
    _.remove(this.classes, item => areEqual(item, selection));
    _.remove(this.attributes, item => areEqual(item, selection));
    _.remove(this.associations, item => areEqual(item, selection));
  }

  private updateLocation() {
    if (!this.loading && this.model) {
      this.locationService.atModel(this.model, this.selection);

      if (!this.model.unsaved) {
        const newSearch: any = {urn: this.model.id};
        if (this.selection) {
          newSearch[normalizeSelectionType(this.selection.type)] = this.selection.id;
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
    if (type === 'class') {
      this.createOrAssignEntity(
        () => this.searchClassModal.open(this.model, collectIds(this.classes)),
        (concept: ConceptCreation) => this.createClass(concept),
        (klass: Class) => this.assignClassToModel(klass)
      );
    } else {
      this.createOrAssignEntity(
        () => this.searchPredicateModal.open(this.model, type, this.getPredicateIds()),
        (concept: ConceptCreation) => this.createPredicate(concept),
        (predicate: Predicate) => this.assignPredicateToModel(predicate.id)
      );
    }
  }

  private getPredicateIds(): Set<Uri> {
    return collectIds([this.attributes, this.associations]);
  }

  private createOrAssignEntity<T extends Class|Predicate>(modal: () => IPromise<ConceptCreation|T>, createNew: (concept: ConceptCreation) => IPromise<T>, assignToModel: (entity: T) => IPromise<any>) {
    this.userService.ifStillLoggedIn(() => {
      this.askPermissionWhenEditing(() => {
        modal().then(result => {
          if (isConceptCreation(result)) {
            createNew(result)
              .then(entity => this.updateSelection(entity));
          } else if (result instanceof Class || result instanceof Predicate) {
            assignToModel(result)
              .then(() => {
                this.updateSelection(result);
                this.updateSelectables();
              });
          }
        });
      });
    });
  }

  private createClass(conceptCreation: ConceptCreation) {
    return this.classService.newClass(this.model, conceptCreation.label, conceptCreation.concept.id, this.languageService.modelLanguage)
      .then(klass => this.updateSelection(klass));
  }

  private assignClassToModel(klass: Class) {

    var predicateIds = this.getPredicateIds();

    this.$q.all(
      _.chain(klass.properties)
        .map((property: Property) => property.predicateId)
        .filter((predicateId: Uri) => !predicateIds.has(predicateId))
        .map((predicateId: Uri) => this.assignPredicateToModel(predicateId))
        .value()
      )
      .then(() => this.updatePredicates());

    return this.classService.assignClassToModel(klass.id, this.model.id);
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
    if (!this.selection || !areEqual(this.selection, selection)) {
      return selection.type === 'class' || selection.type === 'shape'
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

  private updateNewModel(newModel: {prefix: string, label: string, groupId: Uri}) {
    return this.modelService.newModel(newModel.prefix, newModel.label, newModel.groupId, this.languageService.modelLanguage)
      .then(model => this.updateModel(model));
  }

  private updateModel(model: Model) {
    return this.$q.when(this.model = model);
  }

  private updateSelectables(): IPromise<any> {
    return this.$q.all([this.updateClasses(), this.updatePredicates()]);
  }

  private updateClasses(): IPromise<ClassListItem[]> {
    return this.classService.getClassesForModel(this.model.id).then(classes => this.classes = classes);
  }

  private updatePredicates(): IPromise<PredicateListItem[]> {
    return this.predicateService.getPredicatesForModel(this.model.id).then(predicates => {
      this.attributes = _.filter(predicates, predicate => predicate.type === 'attribute');
      this.associations = _.filter(predicates, predicate => predicate.type === 'association');
      return predicates;
    });
  }
}

function areEqual(lhs: WithIdAndType, rhs: WithIdAndType): boolean {
  if ((lhs && !rhs) || (rhs && !lhs)) {
    return false;
  }

  return normalizeSelectionType(lhs.type) === normalizeSelectionType(rhs.type) && lhs.id === rhs.id;
}

class RouteData {

  existingModelId: Uri;

  constructor(private params: any) {
    this.existingModelId = params.urn;
  }

  get newModel() {
    if (this.params.label && this.params.prefix && this.params.group) {
      return {label: this.params.label, prefix: this.params.prefix, groupId: this.params.group};
    }
  }

  get selected() {
    for (const type of ['attribute', 'class', 'association']) {
      const id: Uri = this.params[type];
      if (id) {
        return {type, id};
      }
    }
  }
}

class Tab {

  addLabel: string;
  glyphIconClass: any;
  active: boolean;
  addNew: () => void;

  constructor(public type: Type, public items: () => WithIdAndType[], modelController: ModelController) {
    this.addLabel = 'Add ' + type;
    this.glyphIconClass = glyphIconClassForType(type);
    this.addNew = () => modelController.addEntity(type);
  }
}

interface View {
  isEditing(): boolean;
  cancelEditing(): void;
}
