
import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import ITimeoutService = angular.ITimeoutService;
import { resolveValidator } from './validators';
import { dataTypes } from '../common/dataTypes';
import { module as mod }  from './module';
import { normalizeAsArray } from '../../services/utils';

type Error = { key: string, message: string, format?: string };
const errors: Error[] = [];

for (const dataType of dataTypes) {
  const format = resolveValidator(dataType).format;
  errors.push({ key: dataType, message: dataType + ' error', format: format ? `(${format})` : ''});
}

mod.directive('errorMessages', () => {
  return {
    restrict: 'E',
    template: require('./errorMessages.html'),
    link($scope: ErrorMessagesScope, element: JQuery, attributes: ErrorMessagesAttributes) {
      $scope.dynamicErrors = errors;
      $scope.$watch(attributes.ngModelController, (ngModelController: INgModelController|INgModelController[]) => {
        $scope.ngModelControllers = normalizeAsArray(ngModelController);
      });
      $scope.isVisible = () => {
        if ($scope.ngModelControllers) {
          for (const ngModel of $scope.ngModelControllers) {
            if (ngModel.$dirty || ngModel.$modelValue) {
              return true;
            }
          }
        }
        return false;
      };
    }
  };
});

interface ErrorMessagesAttributes extends IAttributes {
  ngModelController: string;
}

interface ErrorMessagesScope extends IScope {
  ngModelControllers: INgModelController[];
  dynamicErrors: Error[];
  isVisible(): boolean;
}
