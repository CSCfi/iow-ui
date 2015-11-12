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
      range: '='
    },
    restrict: 'E',
    template: '<value-select values="ctrl.ranges" value="ctrl.range"></value-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller() {
      'ngInject';
      this.ranges = attributeValues;
    }
  };
};
