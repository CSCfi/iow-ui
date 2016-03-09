import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { DataType } from '../common/dataTypes';

export const mod = angular.module('iow.components.form');

interface DataTypeInputAttributes extends IAttributes {
  datatypeInput: DataType;
  type: string;
}

mod.directive('datatypeInput', () => {
  return {
    restrict: 'EA',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: DataTypeInputAttributes, ngModel: INgModelController) {
      if (!attributes.datatypeInput) {
        throw new Error('Data type must be defined');
      }

      function initialize(dataType: DataType) {
        ngModel.$validators = { [dataType]: resolveValidator(dataType) };
      }

      initialize(attributes.datatypeInput);
      $scope.$watch<DataType>(() => attributes.datatypeInput, initialize);
    }
  }
});

function resolveValidator(dataType: DataType) {
  switch (dataType) {
    case 'xsd:string':
    case 'rdf:langString':
    case 'xsd:anyURI':
    case 'xsd:boolean':
    case 'xsd:decimal':
    case 'xsd:double':
    case 'xsd:float':
    case 'xsd:integer':
    case 'xsd:long':
    case 'xsd:int':
    case 'xsd:date':
    case 'xsd:dateTime':
    case 'xsd:time':
    case 'xsd:gYear':
    case 'xsd:gMonth':
    case 'xsd:gDay':
      return (input: string) => true;
    default:
      throw new Error('Unsupported data type');
  }
}
