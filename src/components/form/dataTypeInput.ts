import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { DataType } from '../common/dataTypes';
import { isValidUri } from './validators';
import * as moment from 'moment';
import Moment = moment.Moment;

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

function inValues(input: string, ...values: string[]) {
  for (const value of values) {
    if (input === value) {
      return true;
    }
  }
  return false;
}

const decimalRegex = /^\d+\.?\d*$/;
const numberRegex = /^\d+$/;
const dateFormat = 'YYYY-MM-DD';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = 'YYYY-MM-DD H:mm:ss';
const yearFormat = 'YYYY';
const monthFormat = 'MM';
const dayFormat = 'DD';

function resolveValidator(dataType: DataType) {
  switch (dataType) {
    case 'xsd:string':
    case 'rdf:langString':
      return (input: string) => true;
    case 'xsd:anyURI':
      return isValidUri;
    case 'xsd:boolean':
      return (input: string) => inValues('true', 'false');
    case 'xsd:decimal':
    case 'xsd:double':
    case 'xsd:float':
      return (input: string) => !input || decimalRegex.test(input);
    case 'xsd:integer':
    case 'xsd:long':
    case 'xsd:int':
      return (input: string) => !input || numberRegex.test(input);
    case 'xsd:date':
         return (input: string) => !input || moment(input, dateFormat, true).isValid();
    case 'xsd:dateTime':
      return (input: string) => !input || moment(input, dateTimeFormat, true).isValid();
    case 'xsd:time':
      return (input: string) => !input || moment(input, timeFormat, true).isValid();
    case 'xsd:gYear':
      return (input: string) => !input || moment(input, yearFormat, true).isValid();
    case 'xsd:gMonth':
      return (input: string) => !input || moment(input, monthFormat, true).isValid();
    case 'xsd:gDay':
      return (input: string) => !input || moment(input, dayFormat, true).isValid();
    default:
      throw new Error('Unsupported data type');
  }
}
