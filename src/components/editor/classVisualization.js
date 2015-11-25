const _ = require('lodash');
const utils = require('../../services/utils');
const jointjs = require('jointjs');

module.exports = function visualizationDirective($timeout, $window, languageService) {
  'ngInject';

  function isAssociation(property) {
    return property.valueClass;
  }

  function createClass(graph, klass, properties) {
    function propertyAsString(property) {
      const name = languageService.translate(property.label);
      const range = isAssociation(property) ? property.valueClass : property.datatype;
      return range ? `${name} (${range})` : name;
    }

    const propertyNames = _.map(properties, propertyAsString);
    const width = _.max([_.max(_.map(propertyNames, name => name.length)) * 5.5, 150]);
    const height = 15 * (properties.length + 1);

    graph.addCell(new jointjs.shapes.uml.Class({
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

  function createAssociation(graph, {klass, association}) {
    graph.addCell(
      new jointjs.dia.Link({
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

  function createCells(graph, model, data, root) {
    function isRootClass(klass) {
      return klass['@id'] === root;
    }

    const associations = [];

    for (const klass of utils.normalizeAsArray(data['@graph'])) {
      const attributes = [];

      for (const property of utils.normalizeAsArray(klass.property)) {
        if (isRootClass(klass) && isAssociation(property) && model.isCurieDefinedInModel(property.valueClass)) {
          associations.push({klass: klass, association: property});
        } else {
          attributes.push(property);
        }
      }

      createClass(graph, klass, attributes);
    }

    _.forEach(associations, association => createAssociation(graph, association));
  }

  function layoutGraph(graph) {
    jointjs.layout.DirectedGraph.layout(graph, {
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

  function scaleToFit(paper) {
    paper.scaleContentToFit({
      padding: 20,
      minScaleX: 0.1,
      minScaleY: 0.1,
      maxScaleX: 2,
      maxScaleY: 2
    });
  }

  function resizeToContainer(element, paper) {
    const container = element.closest('.visualization-container');
    paper.setDimensions(container.width(), container.height());
  }

  function zoomAndPan(element, paper) {
    const V = jointjs.V(paper.viewport);
    const window = angular.element($window);

    let drag;
    let mouse;

    function moveOrigin(dx, dy) {
      const translation = V.translate();
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
      const scale = V.scale().sx;
      const normalizedScalingDiff = (event.deltaY * event.deltaFactor / 500);
      const newScale = Math.min(Math.max(scale + normalizedScalingDiff, 0.3), 3);
      paper.scale(newScale);
      event.preventDefault();
    });
  }

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
    link($scope, element, attributes, controller) {
      const container = element.closest('.visualization-container');

      function isNotInitialized() {
        return container.width() === 100 || container.width === 0 || container.height() === 100 || container.height() === 0;
      }

      (function init() {
        if (isNotInitialized()) {
          $timeout(init, 100);
        } else {
          createGraph();
        }
      })();

      function createGraph() {
        const graph = new jointjs.dia.Graph;
        const paper = new jointjs.dia.Paper({
          el: element,
          width: container.width(),
          height: container.height(),
          model: graph
        });

        zoomAndPan(element, paper);

        controller.graph = graph;
        controller.paper = paper;
        controller.initGraph();

        angular.element($window).on('resize', () => resizeToContainer(element, paper));
      }
    },
    controller($scope, classService) {
      'ngInject';

      const vm = this;
      vm.initGraph = initGraph;
      let visualizationData;

      $scope.$watch(() => vm.class, refresh);
      $scope.$watch(languageService.getModelLanguage, (newValue, oldValue) => {
        if (newValue && oldValue && newValue !== oldValue) {
          refresh();
        }
      });

      function initGraph() {
        vm.graph.clear();
        createCells(vm.graph, vm.model, visualizationData, vm.class.curie);
        layoutGraph(vm.graph);
        scaleToFit(vm.paper);
      }

      function refresh() {
        if (vm.class) {
          vm.loading = true;
          classService.getVisualizationData(vm.class.id, vm.model.id)
            .then(data => {
              visualizationData = data;
              vm.loading = false;
              if (vm.graph) {
                vm.initGraph();
              }
            });
        }
      }
    }
  };
};
