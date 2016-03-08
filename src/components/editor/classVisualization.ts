import IAttributes = angular.IAttributes;
import IIntervalService = angular.IIntervalService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import IWindowService = angular.IWindowService;
import { LanguageService } from '../../services/languageService';
import { Class, Model, Uri, VisualizationClass, Property, Predicate } from '../../services/entities';
import * as _ from 'lodash';
import { isDefined } from '../../services/utils';
import { layout as colaLayout } from './colaLayout';
import { ModelService } from '../../services/modelService';
import { ChangeNotifier, ChangeListener } from '../contracts';
const joint = require('jointjs');

export const mod = angular.module('iow.components.editor');

mod.directive('classVisualization', ($timeout: ITimeoutService, $window: IWindowService) => {
  'ngInject';

  return {
    restrict: 'E',
    scope: {
      selection: '=',
      model: '=',
      changeNotifier: '='
    },
    template: `<div>
                <div class="zoom zoom-in" ng-mousedown="ctrl.zoomIn($event)" ng-mouseup="ctrl.zoomInEnded($event)"><i class="glyphicon glyphicon-zoom-in"></i></div>
                <div class="zoom zoom-out" ng-mousedown="ctrl.zoomOut($event)"  ng-mouseup="ctrl.zoomOutEnded($event)"><i class="glyphicon glyphicon-zoom-out"></i></div>
                <div class="zoom zoom-fit" ng-click="ctrl.fitToAllContent($event)"><i class="glyphicon glyphicon-fullscreen"></i></div>
                <div ng-show="ctrl.canFocus()" class="zoom zoom-focus" ng-click="ctrl.centerToSelectedClass($event)"><i class="glyphicon glyphicon-screenshot"></i></div>
                <ajax-loading-indicator class="loading-indicator" ng-show="ctrl.loading"></ajax-loading-indicator>
               </div>`,
    bindToController: true,
    controllerAs: 'ctrl',
    require: 'classVisualization',
    link($scope: IScope, element: JQuery, attributes: IAttributes, controller: ClassVisualizationController) {

      element.addClass('visualization-container');

      const {graph, paper} = createGraph(element);

      registerZoomAndPan($window, paper);

      paper.on('cell:pointermove', (cellView: joint.dia.CellView) => {
        const cell = cellView.model;
        if (cell instanceof joint.dia.Element) {
          adjustElementLinks(graph, paper, <joint.dia.Element> cell);
        }
      });

      controller.graph = graph;
      controller.paper = paper;

      const intervalHandle = window.setInterval(() => {
        const xd = paper.options.width - element.width();
        const yd = paper.options.height - element.height();

        if (xd || yd) {
          paper.setDimensions(element.width(), element.height());
          moveOrigin(paper, xd / 2, yd / 2);
        }
      }, 200);

      $scope.$on('$destroy', () => window.clearInterval(intervalHandle));

    },
    controller: ClassVisualizationController
  };
});

class ClassVisualizationController implements ChangeListener<Class|Predicate> {

  selection: Class|Predicate;
  model: Model;
  changeNotifier: ChangeNotifier<Class|Predicate>;

  graph: joint.dia.Graph;
  paper: joint.dia.Paper;
  loading: boolean;

  zoomInHandle: number;
  zoomOutHandle: number;

  /* @ngInject */
  constructor(private $scope: IScope, private modelService: ModelService, private languageService: LanguageService) {

    this.changeNotifier.addListener(this);

    $scope.$watch(() => this.model, () => this.refresh());
    $scope.$watch(() => this.selection, (newSelection) => {
      if (newSelection instanceof Class && this.model && !this.loading) {
        this.centerToClass(newSelection);
      }
    });
  }

  refresh() {
    if (this.model) {
      this.loading = true;
      (<Promise<any>> this.modelService.getVisualizationData(this.model))
        .then(data => this.initGraph(data))
        .then(() => {
          const selection = this.selection;
          if (selection instanceof Class) {
            this.centerToClass(selection);
          } else {
            scaleToFit(this.paper);
          }

          this.loading = false;
        });
    }
  }

  initGraph(visualizationData: VisualizationClass[]) {
    this.graph.clear();
    const showCardinality = this.model.isOfType('profile');
    createCells(this.$scope, this.languageService, this.graph, visualizationData, showCardinality);
    return layoutGraph(this.graph, this.paper);
  }

  onEdit(newItem: Class|Predicate, oldItem: Class|Predicate) {
    if (newItem instanceof Class) {
      this.refresh();
    }
  }

  onDelete(item: Class|Predicate) {
    if (item instanceof Class) {
      this.refresh();
    }
  }

  onAssign(item: Class|Predicate) {
    if (item instanceof Class) {
      this.refresh();
    }
  }

  canFocus() {
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

  fitToAllContent(event: JQueryEventObject) {
    event.stopPropagation();
    scaleToFit(this.paper);
  }

  centerToSelectedClass(event: JQueryEventObject) {
    event.stopPropagation();
    const selection = this.selection;

    if (selection instanceof Class) {
      this.centerToClass(selection);
    }
  }

  centerToClass(klass: Class) {
    const cell = this.graph.getCell(klass.id.uri);
    if (cell) {
      if (cell.isLink()) {
        throw new Error('Cell must be an element');
      } else {
        this.centerToElement(<joint.dia.Element> cell);
      }
    }
  }

  centerToElement(element: joint.dia.Element) {
    const scale = 1;
    const bbox = element.getBBox();
    const x = (this.paper.options.width / 2)  - (bbox.x + bbox.width / 2) * scale;
    const y = (this.paper.options.height / 2) - (bbox.y + bbox.height / 2) * scale;

    this.paper.scale(scale);
    this.paper.setOrigin(x, y);
  }
}

function createGraph(element: JQuery): {graph: joint.dia.Graph, paper: joint.dia.Paper} {

  const graph = new joint.dia.Graph;
  const paper = new joint.dia.Paper({
    el: element,
    width: element.width(),
    height: element.height(),
    model: graph
  });

  return {graph, paper};
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

  if (scale !== newScale && newScale >= 0.1 && newScale <= 3) {
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


function scaleToFit(paper: joint.dia.Paper) {
  paper.scaleContentToFit({
    padding: 45,
    minScaleX: 0.1,
    minScaleY: 0.1,
    maxScaleX: 2,
    maxScaleY: 2
  });
}

function layoutGraph(graph: joint.dia.Graph, paper: joint.dia.Paper) {
  return colaLayout(graph).then(() => adjustGraphLinks(graph, paper));
}

function createCells($scope: IScope, languageService: LanguageService, graph: joint.dia.Graph, classes: VisualizationClass[], showCardinality: boolean) {

  const associations: {klass: VisualizationClass, association: Property}[] = [];
  const classIds = new Set<string>();

  for (const klass of classes) {
    classIds.add(klass.id.uri);
  }

  for (const klass of classes) {
    const attributes: Property[] = [];

    for (const property of klass.properties) {
      if (property.hasAssociationTarget() && classIds.has(property.valueClass.uri)) {
        associations.push({klass: klass, association: property});
      } else {
        attributes.push(property);
      }
    }

    createClass($scope, languageService, graph, klass, attributes, showCardinality);
  }

  for (const association of associations) {
    createAssociation($scope, languageService, graph, association, showCardinality)
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

function createClass($scope: IScope, languageService: LanguageService, graph: joint.dia.Graph, klass: VisualizationClass, properties: Property[], showCardinality: boolean) {

  function getName() {
    return languageService.translate(klass.label);
  }

  function getPropertyNames() {
    function propertyAsString(property: Property): string {
      const name = languageService.translate(property.label);
      const range = property.hasAssociationTarget() ? property.valueClass.compact : property.dataType;
      const cardinality = formatCardinality(property);
      return `- ${name} : ${range}` + (showCardinality ? ` [${cardinality}]` : '');
    }

    return _.map(_.sortBy(properties, property => property.index), propertyAsString);
  }

  function size(propertyNames: string[]) {
    const width = _.max([_.max(_.map(propertyNames, name => name.length)) * 6.5, 150]);
    const height = 12 * propertyNames.length + 35;

    return { width, height };
  }

  const propertyNames = getPropertyNames();

  const classCell: any = new joint.shapes.uml.Class({
    id: klass.id.uri,
    size: size(propertyNames),
    name: getName(),
    attributes: propertyNames,
    attrs: {
      '.uml-class-name-text': {
        'ref': '.uml-class-name-rect', 'ref-y': 0.6, 'ref-x': 0.5, 'text-anchor': 'middle', 'y-alignment': 'middle'
      }
    }
  });

  $scope.$watch(() => languageService.modelLanguage, () => {
    const propertyNames = getPropertyNames();
    classCell.prop('name', getName());
    classCell.prop('attributes', propertyNames);
    classCell.prop('size', size(propertyNames));
  });

  graph.addCell(classCell);
}

function createAssociation($scope: IScope, languageService: LanguageService, graph: joint.dia.Graph, data: {klass: VisualizationClass, association: Property}, showCardinality: boolean) {

  function getName() {
    return languageService.translate(data.association.label);
  }

  const associationCell: any = new joint.dia.Link({
    source: { id: data.klass.id.uri },
    target: { id: data.association.valueClass.uri },
    connector: { name: 'normal' },
    attrs: {
      '.marker-target': {
        d: 'M 10 0 L 0 5 L 10 10 L 3 5 z'
      }
    },
    labels: [
      { position: 0.5, attrs: { text: { text: getName() } } },
      { position: .9, attrs: { text: { text: showCardinality ? formatCardinality(data.association) : ''} } },
    ]
  });

  $scope.$watch(() => languageService.modelLanguage, () => {
    associationCell.prop('labels/0/attrs/text/text', getName());
    if (showCardinality) {
      associationCell.prop('labels/1/attrs/text/text', formatCardinality(data.association));
    }
  });

  graph.addCell(associationCell);
}


function isSiblingLink(lhs: joint.dia.Link, rhs: joint.dia.Link) {
  var lhsSource = lhs.get('source').id;
  var lhsTarget = lhs.get('target').id;
  var rhsSource = rhs.get('source').id;
  var rhsTarget = rhs.get('target').id;

  return (lhsSource === rhsSource && lhsTarget === rhsTarget) || (lhsSource === rhsTarget && lhsTarget === rhsSource);
}

function isLoop(link: joint.dia.Link) {
  return link.get('source').id === link.get('target').id;
}

function adjustGraphLinks(graph: joint.dia.Graph, paper: joint.dia.Paper) {
  for (const link of graph.getLinks()) {
    adjustLink(graph, paper, link);
  }
}

function adjustElementLinks(graph: joint.dia.Graph, paper: joint.dia.Paper, element: joint.dia.Element) {
  for (const link of graph.getConnectedLinks(<joint.dia.Cell> element)) {
    adjustLink(graph, paper, link);
  }
}

function adjustLink(graph: joint.dia.Graph, paper: joint.dia.Paper, link: joint.dia.Link) {

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
          const offset = gapBetweenSiblings * Math.ceil((i+1) / 2);
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

  const mod = siblingIndex % 4;

  function resolveSign() {
    if (mod === 0) return {x: 1, y: 1};
    if (mod === 1) return {x: -1, y: 1};
    if (mod === 2) return {x: 1, y: -1};
    if (mod === 3) return {x: -1, y: -1};
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
