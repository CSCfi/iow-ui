
const values = [
  'xsd:string',
  'rdf:langString',
  'xsd:anyURI',
  'xsd:boolean',
  'xsd:decimal',
  'xsd:double',
  'xsd:float',
  'xsd:integer',
  'xsd:long',
  'xsd:int',
  'xsd:date',
  'xsd:dateTime',
  'xsd:time',
  'xsd:gYear',
  'xsd:gMonth',
  'xsd:gDay',
  'xsd:HTML',
  'xsd:XMLLiteral'
];

module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      attributeParam: '=attribute'
    },
    restrict: 'E',
    template: require('./templates/attributeView.html'),
    controller($scope, propertyService) {
      'ngInject';

      $scope.attributeValues = values;

      $scope.$watch("attributeParam['@id']", id => {
        propertyService.getPropertyById(id).then(data => {
          $scope.attribute = data['@graph'][0];
        });
      });
    }
  };
};
