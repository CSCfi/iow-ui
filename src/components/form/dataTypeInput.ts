import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { DataType } from '../common/dataTypes';
import { resolveValidator } from './validators';

import { module as mod }  from './module';
import gettextCatalog = angular.gettext.gettextCatalog;

interface DataTypeInputAttributes extends IAttributes {
  datatypeInput: DataType;
}

mod.directive('datatypeInput', /* @ngInject */ (gettextCatalog: gettextCatalog) => {
  return {
    restrict: 'EA',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: DataTypeInputAttributes, ngModel: INgModelController) {
      if (!attributes.datatypeInput) {
        throw new Error('Data type must be defined');
      }

      function initialize(dataType: DataType, oldDataType: DataType) {
        const validator = resolveValidator(dataType);
        const placeholder = gettextCatalog.getString('Input') + ' ' + gettextCatalog.getString(dataType).toLowerCase() + '...';
        element.attr('placeholder', validator.format ? placeholder + ` (${validator.format})` : placeholder);

        if (oldDataType) {
          delete ngModel.$validators[oldDataType];
        }

        ngModel.$validators[dataType] = validator;
        ngModel.$error = {};
        ngModel.$validate();
      }

      initialize(attributes.datatypeInput, null);
      $scope.$watch<DataType>(() => attributes.datatypeInput, initialize);
    }
  };
});
