import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import IWindowService = angular.IWindowService;
import { LanguageService } from '../../services/languageService';
import { ModelCache } from '../../services/modelCache';
import { ClassService } from '../../services/classService';
import { Class, Model, Uri } from '../../services/entities';
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
    template: `<ajax-loading-indicator class="loading-indicator" ng-show="ctrl.loading"></ajax-loading-indicator>`,
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

          angular.element($window).on('resize', () => paper.setDimensions(container.width(), container.height()));
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

  private visualizationData: any;

  /* @ngInject */
  constructor($scope: IScope, private classService: ClassService, private languageService: LanguageService, private modelCache: ModelCache) {
    'ngInject';

    $scope.$watch(() => this.class, () => this.refresh());
    $scope.$watch(() => languageService.modelLanguage, (newValue, oldValue) => {
      if (newValue && oldValue && newValue !== oldValue) {
        this.refresh();
      }
    });
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
      createCells(this.languageService, this.modelCache, this.graph, this.model, this.visualizationData, this.class.curie);
      layoutGraph(this.graph);
      scaleToFit(this.paper);
    }
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

function zoomAndPan($window: IWindowService, element: JQuery, paper: joint.dia.Paper) {
  const viewport: any = joint.V(paper.viewport);
  const window = angular.element($window);

  let drag: Coordinates;
  let mouse: Coordinates;

  function moveOrigin(dx: number, dy: number) {
    const translation: any = viewport.translate();
    paper.setOrigin(translation.tx - dx, translation.ty - dy);
  }

  paper.on('blank:pointerdown', () => drag = mouse);
  window.mouseup(() => drag = null);
  element.mousemove(event => {
    mouse = {x: event.offsetX, y: event.offsetY};
    if (drag) {
      moveOrigin(drag.x - mouse.x, drag.y - mouse.y);
      drag = mouse;
    }
  });

  element.children().mousewheel(event => {
    const scale: number = viewport.scale().sx;
    const normalizedScalingDiff = (event.deltaY * event.deltaFactor / 500);
    const newScale = Math.min(Math.max(scale + normalizedScalingDiff, 0.3), 3);
    paper.scale(newScale, newScale);
    event.preventDefault();
  });
}

function layoutGraph(graph: joint.dia.Graph) {
  joint.layout.DirectedGraph.layout(graph, {
    setLinkVertices: false,
    center: true,
    marginX: 20,
    marginY: 20,
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
}

function isAssociation(property: any) {
  return property.valueClass;
}

function createCells(languageService: LanguageService, modelCache: ModelCache, graph: joint.dia.Graph, model: Model, data: any, root: Uri) {
  function isRootClass(klass: any) {
    return klass['@id'] === root;
  }

  const associations: any[] = [];

  for (const klass of normalizeAsArray<any>(data['@graph'])) {
    const attributes: any[] = [];

    for (const property of normalizeAsArray<any>(klass.property)) {
      if (isRootClass(klass) && isAssociation(property) && model.isCurieDefinedInModel(property.valueClass, modelCache)) {
        associations.push({klass: klass, association: property});
      } else {
        attributes.push(property);
      }
    }

    createClass(languageService, graph, klass, attributes);
  }

  _.forEach(associations, association => createAssociation(languageService, graph, association));
}

function createClass(languageService: LanguageService, graph: joint.dia.Graph, klass: any, properties: any[]) {

  function propertyAsString(property: any): string {
    const name = languageService.translate(property.label);
    const range = isAssociation(property) ? property.valueClass : property.datatype;
    return range ? `${name} (${range})` : name;
  }

  const propertyNames = _.map(properties, propertyAsString);
  const width = _.max([_.max(_.map(propertyNames, name => name.length)) * 5.5, 150]);
  const height = 15 * (properties.length + 1);

  graph.addCell(new joint.shapes.uml.Class({
    id: klass['@id'],
    size: { width, height },
    name: languageService.translate(klass.label),
    attributes: propertyNames,
    methods: [],
    attrs: {
      '.uml-class-name-rect': {
        fill: '#68ddd5',
        stroke: '#68ddd5'
      },
      '.uml-class-attrs-rect, .uml-class-methods-rect': {
        fill: '#9687fe',
        stroke: '#9687fe'
      },
      '.uml-class-methods-rect, .uml-class-attrs-rect': {
        fill: '#9687fe',
        stroke: '#9687fe'
      }
    }
  }));
}

function createAssociation(languageService: LanguageService, graph: joint.dia.Graph, {klass, association}) {
  graph.addCell(
    new joint.dia.Link({
      source: { id: klass['@id'] },
      target: { id: association.valueClass },
      attrs: {
        '.marker-target': {
          fill: '#4b4a67',
          stroke: '#4b4a67',
          d: 'M 10 0 L 0 5 L 10 10 L 3 5 z'
        }
      },
      labels: [
        {
          position: 0.5,
          attrs: {
            text: {
              text: languageService.translate(association.label)
            }
          }
        }
      ]
    })
  );
}

