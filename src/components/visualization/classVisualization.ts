import { IAttributes, IQService, IScope, ITimeoutService, IPromise } from 'angular';
import { LanguageService } from '../../services/languageService';
import {
  Class, Model, VisualizationClass, Property, Predicate,
  AssociationTargetPlaceholderClass, AssociationPropertyPosition, ModelPositions, Coordinate, Dimensions
} from '../../services/entities';
import * as _ from 'lodash';
import { ModelService, ClassVisualization } from '../../services/modelService';
import { ChangeNotifier, ChangeListener, Show } from '../contracts';
import * as joint from 'jointjs';
import { module as mod }  from './module';
import { Uri } from '../../services/uri';
import { normalizeAsArray, arraysAreEqual, first } from '../../utils/array';
import { UserService } from '../../services/userService';
import { ConfirmationModal } from '../common/confirmationModal';
import { copyVertices, coordinatesAreEqual, centerToPosition } from '../../utils/entity';
import { SessionService, FocusLevel, NameType } from '../../services/sessionService';
import { NotLoggedInModal } from '../form/notLoggedInModal';
import { VisualizationPopoverDetails } from './popover';
import { ShadowClass, LinkWithoutUnusedMarkup, IowClassElement } from './diagram';
import { PaperHolder } from './paperHolder';
import { ClassInteractionListener } from './contract';
import { moveOrigin, scale, focusElement, centerToElement, scaleToFit } from './paperUtil';
import { adjustElementLinks, layoutGraph, VertexAction } from './layout';
import { Localizer } from '../../utils/language';
import {
  formatClassName, formatAssociationPropertyName,
  formatCardinality, formatAttributeNamesAndAnnotations
} from './formatter';
import { ifChanged } from '../../utils/angular';


mod.directive('classVisualization', () => {
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
               <visualization-popover details="ctrl.popoverDetails" context="ctrl.model"></visualization-popover>
               <ajax-loading-indicator class="loading-indicator" ng-show="ctrl.loading"></ajax-loading-indicator>
    `,
    bindToController: true,
    controllerAs: 'ctrl',
    require: 'classVisualization',
    link($scope: IScope, element: JQuery, attributes: IAttributes, controller: ClassVisualizationController) {
      element.addClass('visualization-container');
      controller.paperHolder = new PaperHolder(element, controller);

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

const zIndexAssociation = 5;
const zIndexClass = 10;

class ClassVisualizationController implements ChangeListener<Class|Predicate>, ClassInteractionListener {

  selection: Class|Predicate;

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

  popoverDetails: VisualizationPopoverDetails;

  localizer: Localizer;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $q: IQService,
              private $timeout: ITimeoutService,
              private modelService: ModelService,
              private languageService: LanguageService,
              private userService: UserService,
              private sessionService: SessionService,
              private confirmationModal: ConfirmationModal,
              private notLoggedInModal: NotLoggedInModal) {

    this.changeNotifier.addListener(this);

    $scope.$watch(() => this.model, () => this.refresh());
    $scope.$watch(() => this.selection, ifChanged((newSelection, oldSelection) => {
      if (!newSelection || !oldSelection) {
        // Need to do this on next frame since selection change will change visualization size
        window.setTimeout(() => this.queueWhenNotVisible(() => this.focusSelection(false)));
      } else {
        this.focusSelection(false);
      }
    }));
    $scope.$watch(() => this.selectionFocus, ifChanged(() => this.focusSelection(false)));
  }

  get selectionFocus() {
    return this.sessionService.visualizationFocus || FocusLevel.ALL;
  }

  set selectionFocus(value: FocusLevel) {
    this.sessionService.visualizationFocus = value;
  }

  get showName() {
    return this.sessionService.showName || NameType.LABEL;
  }

  set showName(value: NameType) {
    this.sessionService.showName = value;
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
    this.userService.ifStillLoggedIn(() => {
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
    }, () => this.notLoggedInModal.open());
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

      this.localizer = this.languageService.createLocalizer(this.model);
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
      // id change can cause massive association realignment in the server
      if (oldItem && newItem.id.notEquals(oldItem.id)) {
        // FIXME: api should block until writes are done and not return inconsistent data
        this.loading = true;
        this.$timeout(() => this.refresh(true), 500);
      } else if (newItem instanceof Class) {
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
      window.setTimeout(() => this.focusSelection(forceFitToAllContent));
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
      setTimeout(() => this.focusSelection(false));
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
    const element = this.findElementForSelection();
    if (element) {
      centerToElement(this.paper, element);
    }
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

  onClassClick(classId: string): void {
    this.selectClassById(new Uri(classId, {}));
  }

  onClassHover(classId: string, coordinate: Coordinate): void {

    const klass = this.classVisualization.getClassById(classId);

    if (klass) {
      this.$scope.$apply(() => {
        this.popoverDetails = {
          coordinate: coordinate,
          comment: klass.comment
        };
      });
    }
  }

  onPropertyHover(classId: string, propertyId: string, coordinate: Coordinate): void {

    const klass = this.classVisualization.getClassById(classId);

    if (klass) {
      this.$scope.$apply(() => {
        this.popoverDetails = {
          coordinate: coordinate,
          comment: first(klass.properties, property => property.internalId.toString() === propertyId).comment
        };
      });
    }
  }

  onHoverExit(): void {
    this.$scope.$apply(() => {
      this.popoverDetails = null;
    });
  }

  focusSelection(forceFitToAllContent: boolean) {
    focusElement(this.paper, this.graph, this.findElementForSelection(), forceFitToAllContent, this.selectionFocus);
  }

  private findElementForSelection(): joint.dia.Element {

    const classOrPredicate = this.selection;

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

    function calculateElementDimensions(className: string, propertyNames: string[]): Dimensions {
      const propertyLengths = _.map(propertyNames, name => name.length);
      const width = _.max([_.max(propertyLengths) * 6.5, className.length * 6.5, 150]);
      const height = 12 * propertyNames.length + 35;

      return { width, height };
    }

    // FIXME: this method does not work with firefox
    function isRightClick() {
      const event = window.event;
      if (event instanceof MouseEvent) {
        return event.which === 3;
      } else {
        return false;
      }
    }

    const showCardinality = this.model.isOfType('profile');
    const classPosition = this.modelPositions.getClass(klass.id);

    const className = formatClassName(klass, this.showName, this.localizer);
    const [propertyNames, propertyAnnotations] = formatAttributeNamesAndAnnotations(klass.properties, showCardinality, this.showName, this.localizer);

    const classConstructor = klass.resolved ? IowClassElement : ShadowClass;
    const dimensions = calculateElementDimensions(className, propertyNames);

    const classCell = new classConstructor({
      id: klass.id.uri,
      size: dimensions,
      name: className,
      attributes: propertyNames,
      attrs: {
        '.uml-class-name-text': {
          'ref': '.uml-class-name-rect', 'ref-y': 0.6, 'ref-x': 0.5, 'text-anchor': 'middle', 'y-alignment': 'middle'
        },
        '.uml-class-attrs-text': {
          'annotations': propertyAnnotations
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
        const [newPropertyNames, newPropertyAnnotations] = formatAttributeNamesAndAnnotations(klass.properties, showCardinality, this.showName, this.localizer);
        const newClassName = formatClassName(klass, this.showName, this.localizer);
        const previousPosition = classCell.position();
        const previousSize = classCell.getBBox();
        const newSize = calculateElementDimensions(newClassName, newPropertyNames);
        const xd = (newSize.width - previousSize.width) / 2;
        const yd = (newSize.height - previousSize.height) / 2;
        classCell.prop('name', newClassName);
        classCell.prop('attributes', newPropertyNames);
        classCell.attr({
          '.uml-class-attrs-text': {
            'annotations': newPropertyAnnotations
          }
        });
        classCell.prop('size', calculateElementDimensions(newClassName, newPropertyNames));
        classCell.position(previousPosition.x - xd, previousPosition.y - yd);
      });
    };

    this.$scope.$watch(() => this.localizer.language, ifChanged(updateCellModel));
    this.$scope.$watch(() => this.showName, ifChanged(updateCellModel));

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

    const showCardinality = this.model.isOfType('profile');

    const associationCell = new LinkWithoutUnusedMarkup({
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
        { position: 0.5, attrs: { text: { text: formatAssociationPropertyName(association, this.showName, this.localizer), id: association.internalId.toString() } } },
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
        associationCell.prop('labels/0/attrs/text/text', formatAssociationPropertyName(association, this.showName, this.localizer));
        if (showCardinality) {
          associationCell.prop('labels/1/attrs/text/text', formatCardinality(association));
        }
      });
    };

    this.$scope.$watch(() => this.localizer.language, ifChanged(updateCellModel));
    this.$scope.$watch(() => this.showName, ifChanged(updateCellModel));

    position.changeListeners.push(vertices => {
      const oldVertices = normalizeAsArray(associationCell.get('vertices'));

      if (!arraysAreEqual(vertices, oldVertices, coordinatesAreEqual)) {
        associationCell.set('vertices', copyVertices(vertices));
      }
    });

    return associationCell;
  }
}
