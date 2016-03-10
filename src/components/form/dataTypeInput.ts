import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { DataType } from '../common/dataTypes';
import {
  isValidUri, isValidTime, isValidDateTime, isValidDate, isValidNumber, isValidDecimal,
  isValidBoolean, isValidYear, isValidMonth, isValidDay
} from './validators';

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
        ngModel.$error = {};
        ngModel.$validate();
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
      return (input: string) => true;
    case 'xsd:anyURI':
      return isValidUri;
    case 'xsd:boolean':
      return isValidBoolean;
    case 'xsd:decimal':
    case 'xsd:double':
    case 'xsd:float':
      return isValidDecimal;
    case 'xsd:integer':
    case 'xsd:long':
    case 'xsd:int':
      return isValidNumber;
    case 'xsd:date':
      return isValidDate;
    case 'xsd:dateTime':
      return isValidDateTime;
    case 'xsd:time':
      return isValidTime;
    case 'xsd:gYear':
      return isValidYear;
    case 'xsd:gMonth':
      return isValidMonth;
    case 'xsd:gDay':
      return isValidDay;
    default:
      throw new Error('Unsupported data type');
  }
}
