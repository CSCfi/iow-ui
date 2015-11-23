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
      id: klass["@id"],
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
        source: { id: klass["@id"] },
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

  function createCells(graph, model, data) {
    function isRootClass(klass) {
      return klass['@id'] === data.root;
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
      rankSep: 100,
      rankDir: "LR"
    });
  }

  function createVisualization(element, model, data) {
    const container = element.closest('.visualization-container');

    var graph = new jointjs.dia.Graph;

    new jointjs.dia.Paper({
      el: element,
      width: container.width(),
      height: container.height(),
      model: graph
    });

    createCells(graph, model, data);
    layoutGraph(graph);
  }

  return {
    restrict: 'E',
    scope: {
      data: '=',
      model: '='
    },
    link($scope, element) {
      $scope.$watch('data', refresh);
      $scope.$watch(languageService.getModelLanguage, refresh);
      angular.element($window).on('resize', refresh);

      function refresh() {
        element.empty();
        $timeout(() => {
          createVisualization(element, $scope.model, $scope.data)
        });
      }
    }
  }
};
