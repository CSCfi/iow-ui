export const mod = angular.module('iow.components.editor');

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


mod.directive('rangeSelect', () => {
  'ngInject';
  return {
    scope: {
      range: '=',
      id: '@'
    },
    restrict: 'E',
    template: '<value-select id="{{ctrl.id}}" values="ctrl.ranges" value="ctrl.range"></value-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller() {
      this.ranges = attributeValues;
    }
  };
});
