import IAttributes = angular.IAttributes;
import IIntervalService = angular.IIntervalService;
import IQService = angular.IQService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import IWindowService = angular.IWindowService;
import { LanguageService } from '../../services/languageService';
import {
  Class, Model, VisualizationClass, Property, Predicate,
  AssociationTargetPlaceholderClass
} from '../../services/entities';
import * as _ from 'lodash';
import { layout as colaLayout } from './colaLayout';
import { ModelService } from '../../services/modelService';
import { ChangeNotifier, ChangeListener, Show } from '../contracts';
import { isDefined } from '../../utils/object';
const joint = require('jointjs');
import { module as mod }  from './module';
import { collectIds } from '../../utils/entity';
import { Iterable } from '../../utils/iterable';
import { Uri } from '../../services/uri';

mod.directive('classVisualization', /* @ngInject */ ($timeout: ITimeoutService, $window: IWindowService) => {
  return {
    restrict: 'E',
    scope: {
      selection: '=',
      model: '=',
      changeNotifier: '='
    },
    template: `
               <div class="visualization-buttons">
                 <div class="button" ng-mousedown="ctrl.zoomOut($event)"  ng-mouseup="ctrl.zoomOutEnded($event)"><i class="fa fa-search-minus"></i></div>
                 <div class="button" ng-mousedown="ctrl.zoomIn($event)" ng-mouseup="ctrl.zoomInEnded($event)"><i class="fa fa-search-plus"></i></div>
                 <div class="button" ng-click="ctrl.fitToContent($event)"><i class="fa fa-arrows-alt"></i></div>
                 <div ng-show="ctrl.canFocus()" class="button zoom-focus" ng-click="ctrl.centerToSelectedClass($event)"><i class="fa fa-crosshairs"></i></div>
                 <span ng-show="ctrl.canFocus()">
                   <div class="button" ng-click="ctrl.focusOut($event)"><i class="fa fa-angle-left"></i></div>
                   <div class="button focus-indicator"><i>{{ctrl.renderSelectionFocus()}}</i></div>
                   <div class="button" ng-click="ctrl.focusIn($event)"><i class="fa fa-angle-right"></i></div>
                 </span>
                 <div class="button" ng-class="{active: ctrl.showId}" ng-click="ctrl.toggleId()"><i>ID</i></div>
               </div>
               <ajax-loading-indicator class="loading-indicator" ng-show="ctrl.loading"></ajax-loading-indicator>
    `,
    bindToController: true,
    controllerAs: 'ctrl',
    require: 'classVisualization',
    link($scope: IScope, element: JQuery, attributes: IAttributes, controller: ClassVisualizationController) {
      element.addClass('visualization-container');
      controller.paperHolder = new PaperHolder($window, element);

      const intervalHandle = window.setInterval(() => {

        const paper = controller.paper;
        const xd = paper.options.width - element.width();
        const yd = paper.options.height - element.height();

        if (xd || yd) {
          paper.setDimensions(element.width(), element.height());
          moveOrigin(paper, xd / 2, yd / 2);
        } else {
          controller.dimensionChangeInProgress = false;
        }
      }, 200);

      $scope.$on('$destroy', () => window.clearInterval(intervalHandle));

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

const zIndexAssociation = 5;
const zIndexClass = 10;
const backgroundClass = 'background';
const selectedClass = 'selected';
const minScale = 0.02;
const maxScale = 3;

class ClassVisualizationController implements ChangeListener<Class|Predicate> {

  selection: Class|Predicate;
  selectionFocus: FocusLevel = FocusLevel.DEPTH1;
  showId = false;

  model: Model;
  changeNotifier: ChangeNotifier<Class|Predicate>;

  loading: boolean;

  zoomInHandle: number;
  zoomOutHandle: number;

  dimensionChangeInProgress: boolean = true;

  paperHolder: PaperHolder;

  /* @ngInject */
  constructor(private $scope: IScope, private $q: IQService, private modelService: ModelService, private languageService: LanguageService) {

    this.changeNotifier.addListener(this);

    $scope.$watch(() => this.model, () => this.refresh());
    $scope.$watch(() => this.selection, newSelection => {
      if (newSelection && newSelection.id.equals(this.model.rootClass)) {
        this.selectionFocus = FocusLevel.ALL;
      }
      this.focus();
    });
    $scope.$watch(() => this.selectionFocus, () => this.focus());
  }

  get paper(): joint.dia.Paper {
    return this.paperHolder.getPaper(this.model);
  }

  get graph(): joint.dia.Graph {
    return <joint.dia.Graph> this.paper.model;
  }

  refresh(invalidateCache: boolean = false) {
    if (this.model) {

      this.paperHolder.setVisible(this.model);

      if (invalidateCache || this.graph.getCells().length === 0) {
        this.loading = true;

        this.modelService.getVisualizationData(this.model)
          .then(data => {
            const process = () => {
              this.graph.resetCells(this.createCells(data));
              this.layoutAndAdjust()
                .then(() => this.focus())
                .then(() => this.loading = false);
            };

            if (this.dimensionChangeInProgress) {
              setTimeout(process, 200);
            } else {
              process();
            }
          });
      }
    }
  }

  layoutAndAdjust(onlyClassIda: Uri[] = []) {
    return this.$q.when(layoutGraph(this.graph, !!this.model.rootClass, onlyClassIda))
      .then(() => adjustLinks(this.paper));
  }

  onDelete(item: Class|Predicate) {
    if (item instanceof Class) {
      this.removeClass(item);
    }
  }

  onEdit(newItem: Class|Predicate, oldItem: Class|Predicate) {
    if (newItem instanceof Class) {
      this.updateClassAndLayout(newItem, oldItem ? oldItem.id : null);
    }
  }

  onAssign(item: Class|Predicate) {
    if (item instanceof Class) {
      this.updateClassAndLayout(item);
    }
  }

  private updateClassAndLayout(klass: Class, oldId?: Uri) {

    const addedClasses = this.addOrReplaceClass(klass);

    if (oldId && !oldId.equals(klass.id)) {
      if (this.isAssociationTarget(oldId)) {
        this.replaceClass(new AssociationTargetPlaceholderClass(oldId, this.model));
      } else {
        this.removeClass(oldId);
      }
    }

    if (addedClasses.length > 0) {
      this.layoutAndAdjust(addedClasses).then(() => this.focus());
    } else {
      this.focus();
    }
  }

  onResize(show: Show) {
    this.dimensionChangeInProgress = true;
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

  focusIn(event: JQueryEventObject) {
    if (this.selectionFocus < FocusLevel.ALL) {
      this.selectionFocus++;
    }
  }

  focusOut(event: JQueryEventObject) {
    if (this.selectionFocus > FocusLevel.DEPTH1) {
      this.selectionFocus--;
    }
  }

  toggleId() {
    this.showId = !this.showId;
  }

  private isSelectionClass() {
    return this.selection instanceof Class;
  }

  zoomIn(event: JQueryEventObject) {
    event.stopPropagation();
    this.zoomInHandle = window.setInterval(() => {
      scale(this.paper, 0.01);
    }, 10);
  }

  zoomInEnded(event: JQueryEventObject) {
    window.clearInterval(this.zoomInHandle);
  }

  zoomOut(event: JQueryEventObject) {
    event.stopPropagation();
    this.zoomOutHandle = window.setInterval(() => {
      scale(this.paper, -0.01);
    }, 10);
  }

  zoomOutEnded(event: JQueryEventObject) {
    event.stopPropagation();
    window.clearInterval(this.zoomOutHandle);
  }

  fitToContent(event?: JQueryEventObject, onlyVisible: boolean = false) {
    if (event) {
      event.stopPropagation();
    }

    if (this.dimensionChangeInProgress) {
      setTimeout(() => this.fitToContent(event, onlyVisible), 200);
    } else {
      scaleToFit(this.paper, this.graph, onlyVisible);
    }
  }

  centerToSelectedClass(event?: JQueryEventObject) {
    if (event) {
      event.stopPropagation();
    }

    const element = this.getClassElement(this.selection);

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

  focus() {
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
    const element = this.getClassElement(this.selection);

    if (element) {
      applyFocus(element, Direction.BOTH, 1, new Set<joint.dia.Element>(), new Set<joint.dia.Element>());
      joint.V(that.paper.findViewByModel(element).el).addClass(selectedClass);
    }

    return this.fitToContent(null, true);
  }

  private getClassElement(classOrPredicate: Class|Predicate): joint.dia.Element {
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
      if (element instanceof shadowClass && this.graph.getConnectedLinks(element).length === 1) {
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

      if (!klass.hasAssociationTarget(new Uri(targetId))) {
        if (targetElement instanceof shadowClass && this.graph.getConnectedLinks(targetElement).length === 1) {
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

    const oldElementLocation = oldElement.attributes.position;
    oldElement.remove();

    const addedClasses = this.addClass(klass, true, oldElementLocation);
    this.graph.addCells(incomingLinks);

    const result = _.filter(addedClasses, addedClass => !klass.id.equals(addedClass) && !oldOutgoingClassIds.has(addedClass.uri));

    return result;
  }

  private addClass(klass: VisualizationClass, addAssociations: boolean, location?: {x: number, y: number}) {
    const classElement = this.createClass(klass);
    if (location) {
      classElement.position(location.x, location.y);
    }
    this.graph.addCell(classElement);

    if (addAssociations) {
      return this.addAssociations(klass).concat([klass.id]);
    } else {
      return [klass.id];
    }
  }

  private addAssociation(klass: VisualizationClass, association: Property) {

    let addedClass = false;

    if (!this.isExistingClass(association.valueClass)) {
      const sourceLocation = this.graph.getCell(klass.id.uri).attributes.position;
      this.addClass(new AssociationTargetPlaceholderClass(association.valueClass, this.model), false, sourceLocation);
      addedClass = true;
    }

    this.graph.addCell(this.createAssociation(klass, association));

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

  private createCells(classes: VisualizationClass[]) {

    const associations: {klass: VisualizationClass, property: Property}[] = [];
    const classIds = collectIds(classes);

    const cells: joint.dia.Cell[] = [];

    for (const klass of classes) {
      for (const property of klass.properties) {

        if (property.isAssociation() && property.valueClass) {
          if (!classIds.has(property.valueClass.uri)) {
            classIds.add(property.valueClass.uri);
            cells.push(this.createClass(new AssociationTargetPlaceholderClass(property.valueClass, this.model)));
          }
          associations.push({klass, property});
        }
      }

      cells.push(this.createClass(klass));
    }

    for (const association of associations) {
      cells.push(this.createAssociation(association.klass, association.property));
    };

    return cells;
  }

  private createClass(klass: VisualizationClass) {

    const that = this;
    const showCardinality = this.model.isOfType('profile');

    function getName() {
      if (that.showId) {
        return klass.id.compact;
      } else {
        return that.languageService.translate(klass.label, that.model);
      }
    }

    function getPropertyNames() {
      function propertyAsString(property: Property): string {
        let name = '';

        if (that.showId) {
          name += property.predicateId.compact;

          if (property.externalId) {
            name += ' / ' + property.externalId;
          }
        } else {
          name += that.languageService.translate(property.label, that.model);
        }

        const range = property.hasAssociationTarget() ? property.valueClass.compact : property.dataType;
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

    const className = getName();
    const propertyNames = getPropertyNames();

    const classConstructor = klass.resolved ? withoutUnusedMarkupClass : shadowClass;

    const classCell = new classConstructor({
      id: klass.id.uri,
      size: size(className, propertyNames),
      name: className,
      attributes: propertyNames,
      attrs: {
        '.uml-class-name-text': {
          'ref': '.uml-class-name-rect', 'ref-y': 0.6, 'ref-x': 0.5, 'text-anchor': 'middle', 'y-alignment': 'middle'
        }
      },
      z: zIndexClass
    });

    function updateCellModel() {
      const newPropertyNames = getPropertyNames();
      const newClassName = getName();
      classCell.prop('name', newClassName);
      classCell.prop('attributes', newPropertyNames);
      classCell.prop('size', size(newClassName, newPropertyNames));
    };

    this.$scope.$watch(() => this.languageService.getModelLanguage(this.model), (lang, oldLang) => {
      if (lang !== oldLang) {
        updateCellModel();
      }
    });

    this.$scope.$watch(() => this.showId, (showId, oldShowId) => {
      if (showId !== oldShowId) {
        updateCellModel();
      }
    });

    return classCell;
  }

  private createAssociation(klass: VisualizationClass, association: Property) {

    const that = this;
    const showCardinality = this.model.isOfType('profile');

    function getName() {
      let name = '';

      if (that.showId) {
        name += association.predicateId.compact;

        if (association.externalId) {
          name += '\n' + association.externalId;
        }
      } else {
        name += that.languageService.translate(association.label, that.model);
      }

      if (association.stem) {
        name += '\n' + ' {' + association.stem + '}';
      }

      return name;
    }

    const associationCell = new withoutUnusedMarkupLink({
      source: { id: klass.id.uri },
      target: { id: association.valueClass.uri },
      connector: { name: 'normal' },
      attrs: {
        '.marker-target': {
          d: 'M 10 0 L 0 5 L 10 10 L 3 5 z'
        }
      },
      labels: [
        { position: 0.5, attrs: { text: { text: getName() } } },
        { position: .9, attrs: { text: { text: showCardinality ? formatCardinality(association) : ''} } }
      ],
      z: zIndexAssociation
    });

    function updateCellModel() {
      associationCell.prop('labels/0/attrs/text/text', getName());
      if (showCardinality) {
        associationCell.prop('labels/1/attrs/text/text', formatCardinality(association));
      }
    }

    this.$scope.$watch(() => this.languageService.getModelLanguage(this.model), (lang, oldLang) => {
      if (lang !== oldLang) {
        updateCellModel();
      }
    });

    this.$scope.$watch(() => this.showId, (showId, oldShowId) => {
      if (showId !== oldShowId) {
        updateCellModel();
      }
    });

    return associationCell;
  }

}

class PaperHolder {

  private cache = new Map<string, { element: JQuery, paper: joint.dia.Paper }>();

  constructor(private $window: IWindowService, private element: JQuery) {
  }

  getPaper(model: Model): joint.dia.Paper {

    const createPaperAndRegisterHandlers = (element: JQuery) => {
      const paper = createPaper(element, new joint.dia.Graph);

      registerZoomAndPan(this.$window, paper);

      paper.on('cell:pointermove', (cellView: joint.dia.CellView) => {
        const cell = cellView.model;
        if (cell instanceof joint.dia.Element) {
          adjustElementLinks(paper, <joint.dia.Element> cell);
        }
      });

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
    snapLinks: false
  });
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

  function times(times: number, callback: () => void) {
    for (let i = 0; i < times; i++) {
      callback();
    }
  }

  function getContentBBox(elements: joint.dia.Element[]) {

    if (elements.length === 0) {
      return paper.getContentBBox();
    }

    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    for (const element of elements) {
      const bbox = paper.findViewByModel(element).getBBox();
      minX = Math.min(minX, (bbox.x));
      minY = Math.min(minY, (bbox.y));
      maxX = Math.max(maxX, (bbox.x + bbox.width));
      maxY = Math.max(maxY, (bbox.y + bbox.height));
    }

    return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
  }

  const visibleElements = !onlyVisible ? [] : _.filter(graph.getElements(), element => {
    return !joint.V(paper.findViewByModel(element).el).hasClass(backgroundClass);
  });

  // TODO: figure out why the algorithm needs to be run twice to get expected results
  times(2, () => {
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
  });
}

function layoutGraph(graph: joint.dia.Graph, directed: boolean, onlyNodeIds: Uri[]): Promise<any> {
  if (directed) {
    // TODO directed doesn't support incremental layout
    return new Promise((resolve) => {
      joint.layout.DirectedGraph.layout(graph, {
        nodeSep: 100,
        edgeSep: 150,
        rankSep: 500,
        rankDir: "LR"
      });
      resolve();
    });
  } else {
    return colaLayout(graph, _.map(onlyNodeIds, id => id.uri));
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

const withoutUnusedMarkupLink = joint.dia.Link.extend({
  markup: [
    '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
    '<path class="marker-target" fill="black" stroke="black" d="M 0 0 0 0"/>',
    '<path class="connection-wrap" d="M 0 0 0 0"/>',
    '<g class="labels"/>',
    '<g class="marker-vertices"/>'
  ].join(''),

  toolMarkup: ''
});


const classMarkup = (shadow: boolean) => {
  return `<g class="rotatable ${shadow ? 'shadow' : ''}">
            <g class="scalable">
              <rect class="uml-class-name-rect"/> ${shadow ? '' : '<rect class="uml-class-attrs-rect"/>'}
            </g>
            <text class="uml-class-name-text"/> ${shadow ? '' : '<text class="uml-class-attrs-text"/>'}
          </g>`;
};

const withoutUnusedMarkupClass = joint.shapes.uml.Class.extend({ markup: classMarkup(false) });
const shadowClass = joint.shapes.uml.Class.extend({ markup: classMarkup(true) });


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

function adjustLinks(paper: joint.dia.Paper) {
  const graph = <joint.dia.Graph> paper.model;

  for (const link of graph.getLinks()) {
    adjustLink(paper, link);
  }
}

function adjustElementLinks(paper: joint.dia.Paper, element: joint.dia.Element) {
  const graph = <joint.dia.Graph> paper.model;

  for (const link of graph.getConnectedLinks(<joint.dia.Cell> element)) {
    adjustLink(paper, link);
  }
}

function adjustLink(paper: joint.dia.Paper, link: joint.dia.Link) {

  const graph = <joint.dia.Graph> paper.model;
  const srcId = link.get('source').id;
  const trgId = link.get('target').id;

  if (srcId && trgId) {

    const siblings = _.filter(graph.getLinks(), _.partial(isSiblingLink, link));
    const srcCenter = (<joint.dia.Element> graph.getCell(srcId)).getBBox().center();
    const trgCenter = (<joint.dia.Element> graph.getCell(trgId)).getBBox().center();
    const midPoint = joint.g.line(srcCenter, trgCenter).midpoint();
    const theta = srcCenter.theta(trgCenter);

    const gapBetweenSiblings = 25;

    if (isLoop(link)) {
      for (let i = 0; i < siblings.length; i++) {
        recurseLink(paper, siblings[i], i);
      }
    } else {
      if (siblings.length === 1) {
        link.unset('vertices');
        link.prop('connector', { name: 'normal' });
      } else {
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i];
          const offset = gapBetweenSiblings * Math.ceil((i + 1) / 2);
          const sign = i % 2 ? 1 : -1;
          const angle = joint.g.toRad(theta + sign * 90);
          const vertex = joint.g.point.fromPolar(offset, angle, midPoint);

          sibling.prop('connector', { name: 'smooth' });
          sibling.set('vertices', [vertex]);
        }
      }
    }
  }
};

function recurseLink(paper: joint.dia.Paper, link: joint.dia.Link, siblingIndex: number) {

  const bbox = joint.V(paper.findViewByModel(link.get('source').id).el).bbox(false, paper.viewport);
  const left = bbox.width / 2;
  const top = bbox.height / 2;
  const centre = joint.g.point(bbox.x + left, bbox.y + top);

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
  const scale = Math.floor(siblingIndex / 4) + 1;

  link.set('vertices', [
    joint.g.point(centre).offset(0, sign.y * (top + offset * scale)),
    joint.g.point(centre).offset(sign.x * (left + offset * scale), sign.y * (top + offset * scale)),
    joint.g.point(centre).offset(sign.x * (left + offset * scale), 0)
  ]);
}
