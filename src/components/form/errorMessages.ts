
import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import ITimeoutService = angular.ITimeoutService;
import { resolveValidator } from './validators';
import { dataTypes } from '../common/dataTypes';
export const mod = angular.module('iow.components.form');

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
      $scope.$watch(attributes.ngModelController, (ngModelController: INgModelController) => {
        $scope.ngModelController = ngModelController;
      });
    }
  }
});

interface ErrorMessagesAttributes extends IAttributes {
  ngModelController: string;
}

interface ErrorMessagesScope extends IScope {
  ngModelController: INgModelController;
  dynamicErrors: Error[];
}
