import IAttributes = angular.IAttributes;
import IIntervalService = angular.IIntervalService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import IWindowService = angular.IWindowService;
import { LanguageService } from '../../services/languageService';
import { ClassService } from '../../services/classService';
import { Class, Model, Uri, VisualizationClass, Property } from '../../services/entities';
import * as _ from 'lodash';
import { normalizeAsArray } from '../../services/utils';
const joint = require('jointjs');

export const mod = angular.module('iow.components.editor');

mod.directive('classVisualization', ($timeout: ITimeoutService, $window: IWindowService) => {
  'ngInject';

  return {
    restrict: 'E',
    scope: {
      class: '=',
      model: '='
    },
    template: `<div>
                <div class="zoom zoom-in" ng-click="ctrl.zoomIn($event)"><span>+</span></div><div class="zoom zoom-out" ng-click="ctrl.zoomOut($event)"><span>-</span></div>
                <ajax-loading-indicator class="loading-indicator" ng-show="ctrl.loading"></ajax-loading-indicator>
               </div>`,
    bindToController: true,
    controllerAs: 'ctrl',
    require: 'classVisualization',
    link($scope: IScope, element: JQuery, attributes: IAttributes, controller: ClassVisualizationController) {
      const container = element.closest('.visualization-container');

      function isNotInitialized() {
        return container.width() === 100 || container.width() === 0 || container.height() === 100 || container.height() === 0;
      }

      (function init() {
        if (isNotInitialized()) {
          $timeout(init, 100);
        } else {
          const {graph, paper} = createGraph(element);

          zoomAndPan($window, element, paper);

          controller.graph = graph;
          controller.paper = paper;
          controller.initGraph();

          let previousWidth = container.width();
          let previousHeight = container.height();

          const intervalHandle = window.setInterval(() => {
            const width = container.width();
            const height = container.height();
            if (previousWidth !== width || previousHeight !== height) {
              paper.setDimensions(container.width(), container.height());
              scaleToFit(paper);
              previousWidth = width;
              previousHeight = height;
            }
          }, 200);

          $scope.$on('$destroy', () => window.clearInterval(intervalHandle));
        }
      })();
    },
    controller: ClassVisualizationController
  };
});

class ClassVisualizationController {

  class: Class;
  model: Model;
  graph: joint.dia.Graph;
  paper: joint.dia.Paper;
  loading: boolean;

  private visualizationData: VisualizationClass[];

  /* @ngInject */
  constructor(private $scope: IScope, private classService: ClassService, private languageService: LanguageService) {
    'ngInject';
    $scope.$watch(() => this.class, () => this.refresh());
  }

  refresh() {
    if (this.class) {
      this.loading = true;
      this.classService.getVisualizationData(this.model, this.class.id)
        .then(data => {
          this.visualizationData = data;
          this.loading = false;
          if (this.graph) {
            this.initGraph();
          }
        });
    }
  }

  initGraph() {
    if (this.visualizationData) {
      this.graph.clear();
      const showCardinality = this.model.isOfType('profile');
      createCells(this.$scope, this.languageService, this.model, this.graph, this.visualizationData, this.class.curie, showCardinality);
      layoutGraph(this.graph);
      scaleToFit(this.paper);
    }
  }

  zoomIn(event: JQueryEventObject) {
    event.stopPropagation();
    scale(this.paper, 0.1);
  }

  zoomOut(event: JQueryEventObject) {
    event.stopPropagation();
    scale(this.paper, -0.1);
  }
}

function createGraph(element: JQuery): {graph: joint.dia.Graph, paper: joint.dia.Paper} {
  const container = element.closest('.visualization-container');
  const graph = new joint.dia.Graph;
  const paper = new joint.dia.Paper({
    el: element,
    width: container.width(),
    height: container.height(),
    model: graph
  });

  return {graph, paper};
}

type Coordinates = {x: number, y: number };


function moveOrigin(paper: joint.dia.Paper, dx: number, dy: number) {
  const viewport: any = joint.V(paper.viewport);
  const translation: any = viewport.translate();
  paper.setOrigin(translation.tx - dx, translation.ty - dy);
}

function scale(paper: joint.dia.Paper, scaleDiff: number) {
  const viewport: any = joint.V(paper.viewport);
  const scale: number = viewport.scale().sx;
  const newScale = Math.min(Math.max(scale + scaleDiff, 0.3), 3);
  paper.scale(newScale, newScale);
}

function zoomAndPan($window: IWindowService, element: JQuery, paper: joint.dia.Paper) {
  const window = angular.element($window);
  let drag: Coordinates;
  let mouse: Coordinates;

  paper.on('blank:pointerdown', () => drag = mouse);
  window.mouseup(() => drag = null);
  element.mousemove(event => {
    mouse = {x: event.offsetX, y: event.offsetY};
    if (drag) {
      moveOrigin(paper, drag.x - mouse.x, drag.y - mouse.y);
      drag = mouse;
    }
  });

  element.children().mousewheel(event => {
    scale(paper, (event.deltaY * event.deltaFactor / 500));
    event.preventDefault();
  });
}

function layoutGraph(graph: joint.dia.Graph) {
  joint.layout.DirectedGraph.layout(graph, {
    setLinkVertices: false,
    center: true,
    nodeSep: 50,
    edgeSep: 200,
    rankSep: 200,
    rankDir: 'LR'
  });
}

function scaleToFit(paper: joint.dia.Paper) {
  paper.scaleContentToFit({
    padding: 20,
    minScaleX: 0.1,
    minScaleY: 0.1,
    maxScaleX: 2,
    maxScaleY: 2
  });

  moveOrigin(paper, 0, -25);
}

function createCells($scope: IScope, languageService: LanguageService, model: Model, graph: joint.dia.Graph, classes: VisualizationClass[], root: Uri, showCardinality: boolean) {

  const associations: {klass: VisualizationClass, association: Property}[] = [];

  for (const klass of normalizeAsArray(classes)) {
    const attributes: Property[] = [];

    for (const property of klass.properties) {
      if (klass.id === root && property.hasAssociationTarget() && model.findModelPrefixForNamespace(model.expandCurie(property.valueClass).namespace)) {
        associations.push({klass: klass, association: property});
      } else {
        attributes.push(property);
      }
    }

    createClass($scope, languageService, graph, klass, attributes, showCardinality);
  }

  _.forEach(associations, association => createAssociation($scope, languageService, graph, association, showCardinality));
}

function formatCardinality(property: Property) {
  const min = property.minCount;
  const max = property.maxCount;

  if (!min && !max) {
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
      const range = property.hasAssociationTarget() ? property.valueClass : property.dataType;
      const cardinality = formatCardinality(property);
      return `- ${name} : ${range}` + (showCardinality ? `[${cardinality}]` : '');
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
    id: klass.id,
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
    source: { id: data.klass.id },
    target: { id: data.association.valueClass },
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

