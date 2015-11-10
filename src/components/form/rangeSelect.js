const attributeValues = [
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


module.exports = function rangeSelect() {
  'ngInject';
  return {
    scope: {
      ngModel: '='
    },
    restrict: 'E',
    template: '<form-select title="Range" ng-model="ctrl.ngModel" values="ctrl.values"></form-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller() {
      this.values = attributeValues;
    }
  };
};
