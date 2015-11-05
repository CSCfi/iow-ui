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


module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      content: '='
    },
    restrict: 'E',
    template: '<form-select title="{{\'Range\' | translate}}" content="ctrl.content" values="ctrl.values"></form-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller() {
      this.values = attributeValues;
    }
  };
};
