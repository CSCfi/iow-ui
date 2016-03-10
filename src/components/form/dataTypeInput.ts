import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { DataType } from '../common/dataTypes';
import { resolveValidator } from './validators';

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
        const validator = resolveValidator(dataType);
        attributes.$set('placeholder', validator.format);
        ngModel.$validators = { [dataType]: validator };
        ngModel.$error = {};
        ngModel.$validate();
      }

      initialize(attributes.datatypeInput);
      $scope.$watch<DataType>(() => attributes.datatypeInput, initialize);
    }
  }
});
