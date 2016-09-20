import { IAttributes, IQService, IScope, ITimeoutService, IWindowService, IPromise, IQResolveReject } from 'angular';
import { LanguageService } from '../../services/languageService';
import {
  Class, Model, VisualizationClass, Property, Predicate,
  AssociationTargetPlaceholderClass, AssociationPropertyPosition, ModelPositions
} from '../../services/entities';
import * as _ from 'lodash';
import { layout as colaLayout } from './colaLayout';
import { ModelService, ClassVisualization } from '../../services/modelService';
import { ChangeNotifier, ChangeListener, Show } from '../contracts';
import { isDefined } from '../../utils/object';
import * as joint from 'jointjs';
import { module as mod }  from './module';
import { Iterable } from '../../utils/iterable';
import { Uri } from '../../services/uri';
import { DataType } from '../../services/dataTypes';
import { normalizeAsArray, arraysAreEqual } from '../../utils/array';
import { UserService } from '../../services/userService';
import { ConfirmationModal } from '../common/confirmationModal';
import { copyVertices, coordinatesAreEqual, centerToPosition } from '../../utils/entity';


mod.directive('classVisualization', /* @ngInject */ ($window: IWindowService) => {
  return {
    restrict: 'E',
    scope: {
      selection: '=',
      model: '=',
      changeNotifier: '=',
      selectClassById: '='
    },
    template: `
               <div class="visualization-buttons">
                 <a role="button" class="btn btn-default btn-xs" ng-mousedown="ctrl.zoomOut()" ng-mouseup="ctrl.zoomOutEnded()"><i class="fa fa-search-minus"></i></a>
                 <a role="button" class="btn btn-default btn-xs" ng-mousedown="ctrl.zoomIn()" ng-mouseup="ctrl.zoomInEnded()"><i class="fa fa-search-plus"></i></a>
                 <a role="button" class="btn btn-default btn-xs" ng-click="ctrl.fitToContent()"><i class="fa fa-arrows-alt"></i></a>
                 <a role="button" ng-show="ctrl.canFocus()" class="btn btn-default btn-xs" ng-click="ctrl.centerToSelectedClass()"><i class="fa fa-crosshairs"></i></a>
                 <span ng-show="ctrl.canFocus()">
                   <a role="button" class="btn btn-default btn-xs" ng-click="ctrl.focusOut()"><i class="fa fa-angle-left"></i></a>
                   <div class="focus-indicator"><i>{{ctrl.renderSelectionFocus()}}</i></div>
                   <a role="button" class="btn btn-default btn-xs" ng-click="ctrl.focusIn()"><i class="fa fa-angle-right"></i></a>
                 </span>
                 <a role="button" class="btn btn-default btn-xs" ng-click="ctrl.toggleShowName()"><i>{{ctrl.showNameLabel | translate}}</i></a>
                 <a role="button" class="btn btn-default btn-xs" ng-show="ctrl.canSave()" ng-disabled="ctrl.modelPositions.isPristine()" ng-click="ctrl.savePositions()"><i class="fa fa-save"></i></a>
                 <a role="button" class="btn btn-default btn-xs" ng-disabled="ctrl.saving" ng-click="ctrl.layoutPersistentPositions()" ng-context-menu="ctrl.relayoutPositions()"><i class="fa fa-refresh"></i></a>
               </div>
               <ajax-loading-indicator class="loading-indicator" ng-show="ctrl.loading"></ajax-loading-indicator>
    `,
    bindToController: true,
    controllerAs: 'ctrl',
    require: 'classVisualization',
    link($scope: IScope, element: JQuery, attributes: IAttributes, controller: ClassVisualizationController) {
      element.addClass('visualization-container');
      controller.paperHolder = new PaperHolder($window, element, id => controller.selectClassById(new Uri(id, {})));

      const setDimensions = () => {
        controller.dimensionChangeInProgress = true;
        const paper = controller.paper;
        const xd = paper.options.width - element.width();
        const yd = paper.options.height - element.height();

        if (xd || yd) {
          paper.setDimensions(element.width(), element.height());
          moveOrigin(paper, xd / 2, yd / 2);
          window.setTimeout(setDimensions);
        } else {
          controller.dimensionChangeInProgress = false;
        }
      };

      const setDimensionsIfNotAlreadyInProgress = () => {
        if (!controller.dimensionChangeInProgress) {
          setDimensions();
        }
      };

      // init
      window.setTimeout(setDimensions);
      controller.setDimensions = () => window.setTimeout(setDimensionsIfNotAlreadyInProgress);
      window.addEventListener('resize', setDimensionsIfNotAlreadyInProgress);

      $scope.$on('$destroy', () => {
        window.removeEventListener('resize', setDimensions);
      });
    },
    controller: ClassVisualizationController
  };
});


enum FocusLevel {
  DEPTH1 = 1,
  DEPTH2 = 2,
  DEPTH3 = 3,
  INFINITE_DEPTH = 4,
  ALL = 5
}

enum Direction {
  INCOMING,
  OUTGOING,
  BOTH
}

enum NameType {
  LABEL,
  ID,
  LOCAL_ID
}

const zIndexAssociation = 5;
const zIndexClass = 10;
const backgroundClass = 'background';
const selectedClass = 'selected';
const minScale = 0.02;
const maxScale = 3;

class ClassVisualizationController implements ChangeListener<Class|Predicate> {

  selection: Class|Predicate;
  selectionFocus: FocusLevel = FocusLevel.ALL;
  showName = NameType.LABEL;

  model: Model;
  changeNotifier: ChangeNotifier<Class|Predicate>;

  loading: boolean;

  zoomInHandle: number;
  zoomOutHandle: number;

  dimensionChangeInProgress: boolean;

  paperHolder: PaperHolder;

  visible = true;
  saving = false;
  operationQueue: (() => void)[] = [];

  classVisualization: ClassVisualization;
  persistentPositions: ModelPositions;

  selectClassById: (id: Uri) => IPromise<any>;
  setDimensions: () => void;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $q: IQService,
              private $timeout: ITimeoutService,
              private modelService: ModelService,
              private languageService: LanguageService,
              private userService: UserService,
              private confirmationModal: ConfirmationModal) {

    this.changeNotifier.addListener(this);

    $scope.$watch(() => this.model, () => this.refresh());
    $scope.$watch(() => this.selection, (newSelection, oldSelection) => {
      if (newSelection !== oldSelection) {
        if (!newSelection || !oldSelection) {
          // Need to do this on next frame since selection change will change visualization size
          window.setTimeout(() => this.queueWhenNotVisible(() => this.focus(false)));
        } else {
          this.focus(false);
        }
      }
    });
    $scope.$watch(() => this.selectionFocus, (newFocus, oldFocus) => {
      if (newFocus !== oldFocus) {
        this.focus(false);
      }
    });
  }

  get paper(): joint.dia.Paper {
    return this.paperHolder.getPaper(this.model);
  }

  get graph(): joint.dia.Graph {
    return <joint.dia.Graph> this.paper.model;
  }

  get modelPositions() {
    return this.classVisualization && this.classVisualization.positions;
  }

  canSave() {
    return this.userService.user.isMemberOf(this.model.group);
  }

  savePositions() {
    this.confirmationModal.openVisualizationLocationsSave()
      .then(() => {
        this.saving = true;
        this.modelService.updateModelPositions(this.model, this.modelPositions)
          .then(() => {
            this.modelPositions.setPristine();
            this.persistentPositions = this.modelPositions.clone();
            this.saving = false;
          });
      });
  }

  relayoutPositions() {
    this.loading = true;
    this.modelPositions.clear();
    this.layoutAndFocus(false)
      .then(() => this.loading = false);
  }

  layoutPersistentPositions() {
    this.loading = true;
    this.modelPositions.resetWith(this.persistentPositions);
    this.layoutPositionsAndFocus(false)
      .then(() => this.loading = false);
  }

  refresh(invalidateCache: boolean = false) {
    if (this.model) {

      this.paperHolder.setVisible(this.model);

      if (invalidateCache || this.graph.getCells().length === 0) {
        this.loading = true;
        this.operationQueue = [];
        this.modelService.getVisualization(this.model)
          .then(visualization => {
            // Hackish way to apply scope outside potentially currently running digest cycle
            visualization.addPositionChangeListener(() => this.$timeout(() => {}));
            this.classVisualization = visualization;
            this.persistentPositions = this.modelPositions.clone();
            this.initialize();
          });
      }
    }
  }

  queueWhenNotVisible(operation: () => void) {
    this.operationQueue.push(operation);

    if (this.visible) {
      this.executeQueue();
    }
  }

  executeQueue() {
    if (this.dimensionChangeInProgress || !this.visible) {
      setTimeout(() => this.executeQueue(), 200);
    } else {
      setTimeout(() => {
        for (let i = this.operationQueue.length - 1; i >= 0; i--) {
          this.operationQueue[i]();
        }
        this.operationQueue = [];
      });
    }
  }

  initialize() {
    this.queueWhenNotVisible(() => {
      this.graph.resetCells(this.createCells(this.classVisualization));

      const forceFitToAllContent = this.selection && this.selection.id.equals(this.model.rootClass);
      this.layoutPositionsAndFocus(forceFitToAllContent).then(() => {
        this.adjustAllLinks(VertexAction.KeepAll);
        this.loading = false;
      });
    });
  }

  layoutPositionsAndFocus(forceFitToAllContent: boolean) {
    const withoutPositionIds = this.classVisualization.getClassIdsWithoutPosition();
    const layoutAll = withoutPositionIds.length === this.classVisualization.classes.length;
    const ids = layoutAll ? null : withoutPositionIds;

    return this.layoutAndFocus(forceFitToAllContent, ids);
  }

  onDelete(item: Class|Predicate) {
    this.queueWhenNotVisible(() => {
      if (item instanceof Class) {
        this.removeClass(item);
      }
    });
  }

  onEdit(newItem: Class|Predicate, oldItem: Class|Predicate) {
    this.queueWhenNotVisible(() => {
      if (newItem instanceof Class) {
        this.updateClassAndLayout(newItem, oldItem ? oldItem.id : null);
      }
    });
  }

  onAssign(item: Class|Predicate) {
    this.queueWhenNotVisible(() => {
      if (item instanceof Class) {
        this.updateClassAndLayout(item);
      }
    });
  }

  layoutAndFocus(forceFitToAllContent: boolean, onlyClassIds?: Uri[] /* // undefined ids means layout all */) {

    const layout = () => {
      if (onlyClassIds && onlyClassIds.length === 0) {
        return this.$q.when();
      } else {
        return layoutGraph(this.$q, this.graph, !!this.model.rootClass, onlyClassIds ? onlyClassIds : []);
      }
    };

    return layout().then(() => {
      // Delay focus because dom needs to be repainted
      window.setTimeout(() => this.focus(forceFitToAllContent));
    });
  }

  private updateClassAndLayout(klass: Class, oldId?: Uri) {

    const idChanged = oldId && klass.id.notEquals(oldId);
    const oldIdIsAssociationTarget = oldId && this.isAssociationTarget(oldId);

    if (idChanged) {
      this.modelPositions.changeClassId(oldId, klass.id);
    }

    const addedClasses = this.addOrReplaceClass(klass);

    if (idChanged) {
      if (oldIdIsAssociationTarget) {
        addedClasses.push(oldId);
        this.replaceClass(new AssociationTargetPlaceholderClass(oldId, this.model));
      } else {
        this.removeClass(oldId);
      }
    }

    this.adjustElementLinks(oldIdIsAssociationTarget ? [klass.id, oldId] : [klass.id], VertexAction.KeepAll);

    if (addedClasses.length > 0) {
      this.layoutAndFocus(false, addedClasses.filter(classId => klass.id.notEquals(classId)));
    } else {
      // Delay focus because dom needs to be repainted
      setTimeout(() => this.focus(false));
    }
  }

  adjustAllLinks(vertexAction: VertexAction) {
    this.adjustElementLinks(null, vertexAction);
  }

  adjustElementLinks(classIds: Uri[], vertexAction: VertexAction) {

    const alreadyAdjusted = new Set<string>();

    if (classIds) {
      for (const classId of classIds) {
        const element = this.graph.getCell(classId.toString());
        if (element instanceof joint.dia.Element) {
          adjustElementLinks(this.paper, <joint.dia.Element> element, alreadyAdjusted, this.modelPositions, vertexAction);
        }
      }
    } else {
      for (const element of this.graph.getElements()) {
        adjustElementLinks(this.paper, element, alreadyAdjusted, this.modelPositions, vertexAction);
      }
    }
  }

  onResize(show: Show) {

    this.visible = show !== Show.Selection;
    this.setDimensions();

    if (this.visible) {
      this.executeQueue();
    }
  }

  canFocus() {
    return this.selection instanceof Class;
  }

  renderSelectionFocus() {
    switch (this.selectionFocus) {
      case FocusLevel.ALL:
        return '**';
      case FocusLevel.INFINITE_DEPTH:
        return '*';
      default:
        return (<number> this.selectionFocus).toString();
    }
  }

  focusIn() {
    if (this.selectionFocus < FocusLevel.ALL) {
      this.selectionFocus++;
    }
  }

  focusOut() {
    if (this.selectionFocus > FocusLevel.DEPTH1) {
      this.selectionFocus--;
    }
  }

  toggleShowName() {
    this.showName = (this.showName + 1) % 3;
  }

  get showNameLabel() {
    switch (this.showName) {
      case NameType.ID:
        return 'ID';
      case NameType.LABEL:
        return 'Label';
      case NameType.LOCAL_ID:
        return 'Local ID';
      default:
        throw new Error('Unsupported show name type: ' + this.showName);
    }
  }

  propertyName(property: Property) {
    switch (this.showName) {
      case NameType.LABEL:
        return this.languageService.translate(property.label, this.model);
      case NameType.ID:
        return property.predicateId.compact;
      case NameType.LOCAL_ID:
        return property.externalId || property.predicateId.compact;
      default:
        throw new Error('Unsupported show name type: ' + this.showName);
    }
  }

  dataTypeName(dataType: DataType) {
    switch (this.showName) {
      case NameType.LABEL:
        return this.languageService.getStringWithModelLanguageOrDefault(dataType, 'en', this.model);
      case NameType.ID:
        return dataType;
      case NameType.LOCAL_ID:
        return dataType;
      default:
        throw new Error('Unsupported show name type: ' + this.showName);
    }
  }

  className(klass: VisualizationClass) {
    switch (this.showName) {
      case NameType.LABEL:
        return this.languageService.translate(klass.label, this.model);
      case NameType.ID:
        return klass.scopeClass ? klass.scopeClass.compact : klass.id.compact;
      case NameType.LOCAL_ID:
        return klass.id.namespaceResolves() ? klass.id.name : klass.id.uri;
      default:
        throw new Error('Unsupported show name type: ' + this.showName);
    }
  }

  private isSelectionClass() {
    return this.selection instanceof Class;
  }

  zoomIn() {
    this.zoomInHandle = window.setInterval(() => scale(this.paper, 0.01), 10);
  }

  zoomInEnded() {
    window.clearInterval(this.zoomInHandle);
  }

  zoomOut() {
    this.zoomOutHandle = window.setInterval(() => scale(this.paper, -0.01), 10);
  }

  zoomOutEnded() {
    window.clearInterval(this.zoomOutHandle);
  }

  fitToContent(onlyVisible: boolean = false) {
    this.queueWhenNotVisible(() => {
      scaleToFit(this.paper, this.graph, onlyVisible);
    });
  }

  centerToSelectedClass() {
    const element = this.findElementForPersistentClass(this.selection);
    if (element) {
      this.centerToElement(element);
    }
  }

  centerToElement(element: joint.dia.Element) {
    const scale = 0.8;
    const bbox = element.getBBox();
    const x = (this.paper.options.width / 2) - (bbox.x + bbox.width / 2) * scale;
    const y = (this.paper.options.height / 2) - (bbox.y + bbox.height / 2) * scale;

    this.paper.scale(scale);
    this.paper.setOrigin(x, y);
  }

  focus(forceFitToAllContent: boolean) {
    const that = this;

    function resetFocusOnAllCells() {
      for (const cell of that.graph.getCells()) {
        const jqueryElement = joint.V(that.paper.findViewByModel(cell).el);

        jqueryElement.removeClass(selectedClass);

        if (that.isSelectionClass() && that.selectionFocus !== FocusLevel.ALL) {
          jqueryElement.addClass(backgroundClass);
        } else {
          jqueryElement.removeClass(backgroundClass);
        }
      }
    }

    function applyFocus(e: joint.dia.Element, direction: Direction, depth: number, visitedOutgoing: Set<joint.dia.Element>, visitedIncoming: Set<joint.dia.Element>) {

      if (that.selectionFocus === FocusLevel.ALL) {
        return;
      }

      const optionsOutgoing = { outbound: true, inbound: false };
      const optionsIncoming = { outbound: false, inbound: true };

      joint.V(that.paper.findViewByModel(e).el).removeClass(backgroundClass);

      if (that.selectionFocus === FocusLevel.INFINITE_DEPTH || depth <= that.selectionFocus) {

        if (direction === Direction.INCOMING || direction === Direction.BOTH) {

            for (const association of that.graph.getConnectedLinks(<joint.dia.Cell> e, optionsIncoming)) {
              joint.V(that.paper.findViewByModel(association).el).removeClass(backgroundClass);
            }

            for (const klass of that.graph.getNeighbors(e, optionsIncoming)) {
              if (!visitedIncoming.has(klass)) {
                visitedIncoming.add(klass);
                applyFocus(klass, Direction.INCOMING, depth + 1, visitedOutgoing, visitedIncoming);
              }
            }
        }

        if (direction === Direction.OUTGOING || direction === Direction.BOTH) {

            for (const association of that.graph.getConnectedLinks(<joint.dia.Cell> e, optionsOutgoing)) {
              joint.V(that.paper.findViewByModel(association).el).removeClass(backgroundClass);
            }

            for (const klass of that.graph.getNeighbors(e, optionsOutgoing)) {
              if (!visitedOutgoing.has(klass)) {
                visitedOutgoing.add(klass);
                applyFocus(klass, Direction.OUTGOING, depth + 1, visitedOutgoing, visitedIncoming);
              }
            }
        }
      }
    }

    resetFocusOnAllCells();
    const element = this.findElementForPersistentClass(this.selection);

    if (element) {
      applyFocus(element, Direction.BOTH, 1, new Set<joint.dia.Element>(), new Set<joint.dia.Element>());
      joint.V(that.paper.findViewByModel(element).el).addClass(selectedClass);
    }

    if (forceFitToAllContent) {
      this.fitToContent(false);
    } else if (element) {
      if (this.selectionFocus === FocusLevel.ALL) {
        this.centerToElement(element);
      } else {
        this.fitToContent(true);
      }
    } else {
      this.fitToContent(true);
    }
  }

  private findElementForPersistentClass(classOrPredicate: Class|Predicate): joint.dia.Element {
    if (classOrPredicate instanceof Class && !classOrPredicate.unsaved) {
      const cell = this.graph.getCell(classOrPredicate.id.uri);
      if (cell) {
        if (cell.isLink()) {
          throw new Error('Cell must be an element');
        } else {
          return <joint.dia.Element> cell;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  private removeClass(klass: Class|Uri) {

    const id: Uri = klass instanceof Class ? klass.id : <Uri> klass;

    // remove to be unreferenced shadow classes
    for (const element of this.graph.getNeighbors(<joint.dia.Element> this.graph.getCell(id.uri))) {
      if (element instanceof ShadowClass && this.graph.getConnectedLinks(element).length === 1) {
        element.remove();
      }
    }

    if (this.isAssociationTarget(klass)) {
      this.replaceClass(new AssociationTargetPlaceholderClass(id, this.model));
    } else {
      this.graph.getCell(id.uri).remove();
    }
  }

  private addOrReplaceClass(klass: VisualizationClass) {
    if (this.isExistingClass(klass.id)) {
      return this.replaceClass(klass);
    } else {
      return this.addClass(klass, true);
    }
  }

  private replaceClass(klass: VisualizationClass) {

    const oldElement = this.graph.getCell(klass.id.uri);
    const incomingLinks: joint.dia.Link[] = [];
    const oldOutgoingClassIds = new Set<string>();

    for (const link of this.graph.getConnectedLinks(oldElement)) {

      const targetId = link.attributes.target.id;
      const targetElement = this.graph.getCell(targetId);

      if (!klass.hasAssociationTarget(new Uri(targetId, {}))) {
        if (targetElement instanceof ShadowClass && this.graph.getConnectedLinks(targetElement).length === 1) {
          // Remove to be unreferenced shadow class
          targetElement.remove();
        }
      } else {
        oldOutgoingClassIds.add(targetId);
      }

      if (link.attributes.source.id === klass.id.uri) {
        // remove outgoing links since they will be added again
        link.remove();
      } else {
        incomingLinks.push(link);
      }
    }

    oldElement.remove();

    const addedClasses = this.addClass(klass, true);
    this.graph.addCells(incomingLinks);

    return _.filter(addedClasses, addedClass => !klass.id.equals(addedClass) && !oldOutgoingClassIds.has(addedClass.uri));
  }

  private addClass(klass: VisualizationClass, addAssociations: boolean) {
    const classElement = this.createClassElement(this.paper, klass);

    this.graph.addCell(classElement);

    if (addAssociations) {
      return this.addAssociations(klass).concat([klass.id]);
    } else {
      return [klass.id];
    }
  }

  private addAssociation(klass: VisualizationClass, association: Property) {

    let addedClass = false;
    const classPosition = this.modelPositions.getClass(klass.id);

    if (!this.isExistingClass(association.valueClass)) {
      // set target location as source location for layout
      classPosition.setCoordinate(this.graph.getCell(klass.id.uri).attributes.position);
      this.addClass(new AssociationTargetPlaceholderClass(association.valueClass, this.model), false);
      addedClass = true;
    }

    this.graph.addCell(this.createAssociationLink(klass, association, classPosition.getAssociationProperty(association.internalId)));

    return addedClass;
  }

  private addAssociations(klass: VisualizationClass) {
    const addedClasses: Uri[] = [];

    for (const association of klass.associationPropertiesWithTarget) {
      const addedClass = this.addAssociation(klass, association);
      if (addedClass) {
        addedClasses.push(association.valueClass);
      }
    }

    return addedClasses;
  }

  isExistingClass(klass: Class|Uri) {
    const id: Uri = klass instanceof Class ? klass.id : <Uri> klass;
    return !!this.graph.getCell(id.uri);
  }

  isAssociationTarget(klass: Class|Uri) {
    const id: Uri = klass instanceof Class ? klass.id : <Uri> klass;

    for (const link of this.graph.getLinks()) {
      if (link.attributes.target.id === id.uri) {
        return true;
      }
    }
    return false;
  }

  private createCells(visualization: ClassVisualization) {

    const associations: {klass: VisualizationClass, property: Property}[] = [];
    const classIds = visualization.getClassIds();

    const cells: joint.dia.Cell[] = [];

    for (const klass of visualization.classes) {

      for (const property of klass.properties) {

        if (property.isAssociation() && property.valueClass) {
          if (!classIds.has(property.valueClass.uri)) {
            classIds.add(property.valueClass.uri);
            cells.push(this.createClassElement(this.paper, new AssociationTargetPlaceholderClass(property.valueClass, this.model)));
          }
          associations.push({klass, property});
        }
      }
      const element = this.createClassElement(this.paper, klass);

      cells.push(element);
    }

    for (const association of associations) {
      const associationPosition = this.modelPositions.getAssociationProperty(association.klass.id, association.property.internalId);
      const link = this.createAssociationLink(association.klass, association.property, associationPosition);
      cells.push(link);
    }

    return cells;
  }

  private createClassElement(paper: joint.dia.Paper, klass: VisualizationClass) {

    const that = this;
    const showCardinality = this.model.isOfType('profile');
    const classPosition = this.modelPositions.getClass(klass.id);

    function getPropertyNames() {

      function propertyAsString(property: Property): string {
        const name = that.propertyName(property);
        const range = property.hasAssociationTarget() ? property.valueClass.compact : that.dataTypeName(property.dataType);
        const cardinality = formatCardinality(property);
        return `- ${name} : ${range}` + (showCardinality ? ` [${cardinality}]` : '');
      }

      const attributes = _.filter(klass.properties, property => property.isAttribute());
      return _.map(_.sortBy(attributes, property => property.index), propertyAsString);
    }

    function size(className: string, propertyNames: string[]) {
      const propertyLengths = _.map(propertyNames, name => name.length);
      const width = _.max([_.max(propertyLengths) * 6.5, className.length * 6.5, 150]);
      const height = 12 * propertyNames.length + 35;

      return { width, height };
    }

    const className = this.className(klass);
    const propertyNames = getPropertyNames();

    const classConstructor = klass.resolved ? WithoutUnusedMarkupClass : ShadowClass;
    const dimensions = size(className, propertyNames);

    const classCell = new classConstructor({
      id: klass.id.uri,
      size: dimensions,
      name: className,
      attributes: propertyNames,
      attrs: {
        '.uml-class-name-text': {
          'ref': '.uml-class-name-rect', 'ref-y': 0.6, 'ref-x': 0.5, 'text-anchor': 'middle', 'y-alignment': 'middle'
        }
      },
      position: classPosition.isDefined() ? centerToPosition(classPosition.coordinate, dimensions) : { x: 0, y: 0 },
      z: zIndexClass
    });

    classCell.on('change:position', () => {
      const newCenter = classCell.getBBox().center();
      if (!coordinatesAreEqual(newCenter, classPosition.coordinate)) {
        adjustElementLinks(paper, classCell, new Set<string>(), this.modelPositions, isRightClick() ? VertexAction.Reset : VertexAction.KeepNormal);
        classPosition.setCoordinate(newCenter);
      }
    });

    const updateCellModel = () => {
      this.queueWhenNotVisible(() => {
        const newPropertyNames = getPropertyNames();
        const newClassName = that.className(klass);
        const previousPosition = classCell.position();
        const previousSize = classCell.getBBox();
        const newSize = size(newClassName, newPropertyNames);
        const xd = (newSize.width - previousSize.width) / 2;
        const yd = (newSize.height - previousSize.height) / 2;
        classCell.prop('name', newClassName);
        classCell.prop('attributes', newPropertyNames);
        classCell.prop('size', size(newClassName, newPropertyNames));
        classCell.position(previousPosition.x - xd, previousPosition.y - yd);
      });
    };

    this.$scope.$watch(() => this.languageService.getModelLanguage(this.model), (lang, oldLang) => {
      if (lang !== oldLang) {
        updateCellModel();
      }
    });

    this.$scope.$watch(() => this.showName, (showName, oldShowName) => {
      if (showName !== oldShowName) {
        updateCellModel();
      }
    });

    classPosition.changeListeners.push(coordinate => {
      const bbox = classCell.getBBox();
      const newPosition = centerToPosition(coordinate, bbox);

      if (coordinate && !coordinatesAreEqual(newPosition, bbox)) {
        classCell.position(newPosition.x, newPosition.y);
        adjustElementLinks(paper, classCell, new Set<string>(), this.modelPositions, VertexAction.KeepAll);
      }
    });

    return classCell;
  }

  private createAssociationLink(klass: VisualizationClass, association: Property, position: AssociationPropertyPosition) {

    const that = this;
    const showCardinality = this.model.isOfType('profile');

    function getName() {
      const name = that.propertyName(association);

      if (association.stem) {
        return name + '\n' + ' {' + association.stem + '}';
      } else {
        return name;
      }
    }

    const associationCell = new WithoutUnusedMarkupLink({
      source: { id: klass.id.uri },
      target: { id: association.valueClass.uri },
      connector: { name: 'normal' },
      attrs: {
        '.marker-target': {
          d: 'M 10 0 L 0 5 L 10 10 L 3 5 z'
        }
      },
      internalId: association.internalId.uri,
      labels: [
        { position: 0.5, attrs: { text: { text: getName() } } },
        { position: .9, attrs: { text: { text: showCardinality ? formatCardinality(association) : ''} } }
      ],
      vertices: copyVertices(position.vertices),
      z: zIndexAssociation
    });

    associationCell.on('change:vertices', () => {
      const propertyPosition = this.modelPositions.getAssociationProperty(klass.id, association.internalId);
      const vertices = normalizeAsArray(associationCell.get('vertices'));
      const oldVertices = propertyPosition.vertices;

      if (!arraysAreEqual(vertices, oldVertices, coordinatesAreEqual)) {
        propertyPosition.setVertices(copyVertices(normalizeAsArray(associationCell.get('vertices'))));
        // TODO do actual calculation
        associationCell.prop('labels/0/position', 0.5);
      }
    });

    const updateCellModel = () => {
      this.queueWhenNotVisible(() => {
        associationCell.prop('labels/0/attrs/text/text', getName());
        if (showCardinality) {
          associationCell.prop('labels/1/attrs/text/text', formatCardinality(association));
        }
      });
    };

    this.$scope.$watch(() => this.languageService.getModelLanguage(this.model), (lang, oldLang) => {
      if (lang !== oldLang) {
        updateCellModel();
      }
    });

    this.$scope.$watch(() => this.showName, (showName, oldShowName) => {
      if (showName !== oldShowName) {
        updateCellModel();
      }
    });

    position.changeListeners.push(vertices => {
      const oldVertices = normalizeAsArray(associationCell.get('vertices'));

      if (!arraysAreEqual(vertices, oldVertices, coordinatesAreEqual)) {
        associationCell.set('vertices', copyVertices(vertices));
      }
    });

    return associationCell;
  }
}

class PaperHolder {

  private cache = new Map<string, { element: JQuery, paper: joint.dia.Paper }>();

  constructor(private $window: IWindowService, private element: JQuery, private onClickCallback: (id: string) => void) {
  }

  getPaper(model: Model): joint.dia.Paper {

    const createPaperAndRegisterHandlers = (element: JQuery) => {
      const paper = createPaper(element, new joint.dia.Graph);

      paper.on('cell:pointerclick', (cellView: joint.dia.CellView) => {
        const cell: joint.dia.Cell = cellView.model;
        if (cell instanceof joint.shapes.uml.Class && !(cell instanceof ShadowClass)) {
          this.onClickCallback(cell.id);
        }
      });

      registerZoomAndPan(this.$window, paper);
      return paper;
    };

    const cached = this.cache.get(model.id.uri);

    if (cached) {
      return cached.paper;
    } else {
      const newElement = jQuery(document.createElement('div'));
      this.element.append(newElement);
      const newPaper = createPaperAndRegisterHandlers(newElement);
      this.cache.set(model.id.uri, { element: newElement, paper: newPaper });
      return newPaper;
    }
  }

  setVisible(model: Model) {
    Iterable.forEach(this.cache.entries(), ([modelId, value]) => {
      if (model.id.uri === modelId) {
        value.element.show();
      } else {
        value.element.hide();
      }
    });
  }
}

function createPaper(element: JQuery, graph: joint.dia.Graph): joint.dia.Paper {
  return new joint.dia.Paper({
    el: element,
    width: element.width() || 100,
    height: element.height() || 100,
    model: graph,
    linkPinning: false,
    snapLinks: false,
    perpendicularLinks: true
  });
}

function isRightClick() {
  const event = window.event;
  if (event instanceof MouseEvent) {
    return event.which === 3;
  } else {
    return false;
  }
}

function moveOrigin(paper: joint.dia.Paper, dx: number, dy: number) {
  const oldOrigin = paper.options.origin;
  paper.setOrigin(oldOrigin.x - dx, oldOrigin.y - dy);
}

function getScale(paper: joint.dia.Paper) {
  const viewport = joint.V(paper.viewport);
  return viewport.scale().sx;
}

function scale(paper: joint.dia.Paper, scaleDiff: number, x?: number, y?: number) {
  const scale = getScale(paper);
  const newScale = scale + scaleDiff;

  if (scale !== newScale && newScale >= minScale && newScale <= maxScale) {
    const scaleRatio = newScale / scale;

    const actualX = x || paper.options.width / 2;
    const actualY = y || paper.options.height / 2;

    const tx = scaleRatio * (paper.options.origin.x - actualX) + actualX;
    const ty = scaleRatio * (paper.options.origin.y - actualY) + actualY;

    paper.setOrigin(tx, ty);
    paper.scale(newScale, newScale);
  }
}

function registerZoomAndPan($window: IWindowService, paper: joint.dia.Paper) {
  const window = angular.element($window);
  let drag: {x: number, y: number};
  let mouse: {x: number, y: number};

  paper.on('blank:pointerdown', () => drag = mouse);
  window.mouseup(() => drag = null);
  window.mousemove(event => {
    mouse = {x: event.offsetX, y: event.offsetY};
    if (drag) {
      moveOrigin(paper, drag.x - mouse.x, drag.y - mouse.y);
      drag = mouse;
    }
  });

  jQuery(paper.$el).mousewheel(event => {
    event.preventDefault();
    scale(paper, (event.deltaY * event.deltaFactor / 500), event.offsetX, event.offsetY);
  });
}

function scaleToFit(paper: joint.dia.Paper, graph: joint.dia.Graph, onlyVisible: boolean) {

  function isVisible(modelOrId: Element|string) {
    return !joint.V(paper.findViewByModel(modelOrId).el).hasClass(backgroundClass);
  }

  function getContentBBox(elements: joint.dia.Element[]) {

    if (elements.length === 0) {
      return paper.getContentBBox();
    }

    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    function applyBBox(bbox: { x: number; y: number; width: number; height: number; }) {
      minX = Math.min(minX, (bbox.x));
      minY = Math.min(minY, (bbox.y));
      maxX = Math.max(maxX, (bbox.x + bbox.width));
      maxY = Math.max(maxY, (bbox.y + bbox.height));
    }

    for (const element of elements) {

      applyBBox(paper.findViewByModel(element).getBBox());

      for (const link of graph.getConnectedLinks(element)) {
        if (isVisible(link.get('source').id) && isVisible(link.get('target').id)) {
          applyBBox(paper.findViewByModel(link).getBBox());
        }
      }
    }

    return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
  }

  const visibleElements = !onlyVisible ? [] : _.filter(graph.getElements(), isVisible);
  const scale = getScale(paper);
  const padding = 45;

  const contentBBox = getContentBBox(visibleElements);
  const fittingBBox = {
    x: paper.options.origin.x + padding,
    y: paper.options.origin.y + padding,
    width: paper.options.width - padding * 2,
    height: paper.options.height - padding * 2
  };

  const newScale = Math.min(fittingBBox.width / contentBBox.width * scale, fittingBBox.height / contentBBox.height * scale);

  paper.scale(Math.max(Math.min(newScale, maxScale), minScale));
  const contentBBoxAfterScaling = getContentBBox(visibleElements);

  const newOx = fittingBBox.x - contentBBoxAfterScaling.x;
  const newOy = fittingBBox.y - contentBBoxAfterScaling.y;

  paper.setOrigin(newOx, newOy);
}

function layoutGraph($q: IQService, graph: joint.dia.Graph, directed: boolean, onlyNodeIds: Uri[]): IPromise<any> {
  if (directed && onlyNodeIds.length === 0) {
    // TODO directed doesn't support incremental layout

    return $q.when(
      joint.layout.DirectedGraph.layout(graph, {
        nodeSep: 100,
        edgeSep: 150,
        rankSep: 500,
        rankDir: "LR"
      })
  );
  } else {
    return $q((resolve: IQResolveReject<any>, reject: IQResolveReject<any>) => {
      colaLayout(graph, _.map(onlyNodeIds, id => id.uri))
        .then(() => resolve(), err => reject(err));
    });
  }
}

function formatCardinality(property: Property) {
  const min = property.minCount;
  const max = property.maxCount;

  if (!isDefined(min) && !isDefined(max)) {
    return '*';
  } else if (min === max) {
    return min.toString();
  } else {
    return `${min || '0'}..${max || '*'}`;
  }
}

class WithoutUnusedMarkupLink extends joint.dia.Link {
  markup = [
    '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
    '<path class="marker-target" fill="black" stroke="black" d="M 0 0 0 0"/>',
    '<path class="connection-wrap" d="M 0 0 0 0"/>',
    '<g class="labels"/>',
    '<g class="marker-vertices"/>'
    ].join('');

  toolMarkup = '';
}

const classMarkup = (shadow: boolean) => {
  return `<g class="rotatable ${shadow ? 'shadow' : ''}">
            <g class="scalable">
              <rect class="uml-class-name-rect"/> ${shadow ? '' : '<rect class="uml-class-attrs-rect"/>'}
            </g>
            <text class="uml-class-name-text"/> ${shadow ? '' : '<text class="uml-class-attrs-text"/>'}
          </g>`;
};

class WithoutUnusedMarkupClass extends joint.shapes.uml.Class {
  markup = classMarkup(false);
}

class ShadowClass extends joint.shapes.uml.Class {
  markup = classMarkup(true);
}

function isSiblingLink(lhs: joint.dia.Link, rhs: joint.dia.Link) {
  const lhsSource = lhs.get('source').id;
  const lhsTarget = lhs.get('target').id;
  const rhsSource = rhs.get('source').id;
  const rhsTarget = rhs.get('target').id;

  return (lhsSource === rhsSource && lhsTarget === rhsTarget) || (lhsSource === rhsTarget && lhsTarget === rhsSource);
}

function isLoop(link: joint.dia.Link) {
  return link.get('source').id === link.get('target').id;
}

function adjustElementLinks(paper: joint.dia.Paper, element: joint.dia.Element, alreadyAdjusted: Set<string>, modelPositions: ModelPositions, vertexAction: VertexAction) {
  const graph = <joint.dia.Graph> paper.model;

  const connectedLinks = graph.getConnectedLinks(<joint.dia.Cell> element);

  for (const link of connectedLinks) {
    if (!alreadyAdjusted.has(link.id) && !!link.get('source').id && !!link.get('target').id) {
      const siblings = _.filter(connectedLinks, _.partial(isSiblingLink, link));
      adjustSiblingLinks(paper, siblings, alreadyAdjusted, modelPositions, vertexAction);
    }
  }
}

enum VertexAction {
  Reset, KeepNormal, KeepAll
}

function adjustSiblingLinks(paper: joint.dia.Paper, siblings: joint.dia.Link[], alreadyAdjusted: Set<string>, modelPositions: ModelPositions, vertexAction: VertexAction) {

  function getLinkPositionVertices(link: joint.dia.Link) {
    const sourcePosition = modelPositions.getClass(new Uri(link.get('source').id, {}));
    return sourcePosition.getAssociationProperty(new Uri(link.get('internalId'), {})).vertices;
  }

  function getPersistedVertices(link: joint.dia.Link, siblingCount: number, isLoop: boolean) {
    if (vertexAction === VertexAction.Reset || (vertexAction === VertexAction.KeepNormal && (siblingCount > 1 || isLoop))) {
      return null;
    } else {
      return getLinkPositionVertices(link);
    }
  }

  const graph = <joint.dia.Graph> paper.model;
  const first = siblings[0];
  const firstSource = first.get('source');
  const loop = isLoop(first);

  for (let i = 0; i < siblings.length; i++) {

    const link = siblings[i];
    const source = (<joint.dia.Element> graph.getCell(link.get('source').id));
    const target = (<joint.dia.Element> graph.getCell(link.get('target').id));
    const persistedVertices = getPersistedVertices(link, siblings.length, loop);

    if (persistedVertices) {
      link.set('vertices', persistedVertices);
    } else if (loop) {
      link.set('vertices', calculateRecurseSiblingVertices(source, i));
    } else if (siblings.length > 1) {
      if (firstSource.id === source.id) {
        link.set('vertices', calculateNormalSiblingVertices(source, target, i));
      } else {
        link.set('vertices', calculateNormalSiblingVertices(target, source, i));
      }
    } else {
      link.unset('vertices');
    }

    if (!loop && siblings.length > 1) {
      const length = (paper.findViewByModel(link) as joint.dia.LinkView).getConnectionLength();
      link.prop('labels/0/position', calculateNormalSiblingLabelPosition(length, firstSource.id !== source.id, i));
    } else {
      link.prop('labels/0/position', 0.5);
    }

    alreadyAdjusted.add(link.id);
  }
}

function calculateNormalSiblingLabelPosition(linkLength: number, inverseDirection: boolean, siblingIndex: number) {
  const sign = siblingIndex % 2 ? 1 : -1;
  const gapBetweenSiblings = 30;
  return (linkLength / 2) + (sign * (inverseDirection ? -1 : 1) * Math.ceil(siblingIndex / 2) * gapBetweenSiblings) + (inverseDirection ? 10 : 0);
}

function calculateNormalSiblingVertices(source: joint.dia.Element, target: joint.dia.Element, siblingIndex: number) {

  const gapBetweenSiblings = 25;

  const srcCenter = source.getBBox().center();
  const trgCenter = target.getBBox().center();
  const midPoint = joint.g.line(srcCenter, trgCenter).midpoint();
  const theta = srcCenter.theta(trgCenter);

  const offset = gapBetweenSiblings * Math.ceil(siblingIndex / 2);
  const sign = siblingIndex % 2 ? 1 : -1;
  const angle = joint.g.toRad(theta + sign * 90);
  const vertex = joint.g.point.fromPolar(offset, angle, midPoint);

  return [vertex];
}

function calculateRecurseSiblingVertices(element: joint.dia.Element, siblingIndex: number) {

  const bbox = element.getBBox();
  const position = siblingIndex % 4;

  function resolveSign() {
    switch (position) {
      case 0:
        return { x: 1,  y: 1 };
      case 1:
        return { x: -1, y: 1 };
      case 2:
        return { x: 1,  y: -1 };
      case 3:
        return { x: -1, y: -1 };
      default:
        throw new Error('Unsupported position: ' + position);
    }
  }

  const offset = 50;
  const sign = resolveSign();
  const center = joint.g.point(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
  const corner = joint.g.point(center).offset(bbox.width / 2 * sign.x, bbox.height / 2 * sign.y);
  const scale = Math.floor(siblingIndex / 4) + 1;

  return [
    joint.g.point(corner).offset(-sign.x * bbox.width / 4, sign.y * (offset * scale)),
    joint.g.point(corner).offset(sign.x * (offset * scale), sign.y * (offset * scale)),
    joint.g.point(corner).offset(sign.x * (offset * scale), -sign.y * bbox.height / 4)
  ];
}
