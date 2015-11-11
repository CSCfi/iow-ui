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
    template: `<select class="editable-input form-control" ng-model="range">
                 <option value="" translate>Not selected</option>
                 <option ng-repeat="value in ctrl.values" value="{{value}}">{{ctrl.displayName(value)}}</option>
               </select>`,
    controllerAs: 'ctrl',
    bindToController: true,
    controller(gettextCatalog) {
      'ngInject';
      this.values = attributeValues;
      this.displayName = (text) => text && `${gettextCatalog.getString(text)} (${text})`;
    }
  };
};
