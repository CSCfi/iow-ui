import { IScope, IAttributes, INgModelController } from 'angular';
import { resolveValidator } from './validators';
import { normalizeAsArray } from '../../utils/array';
import { module as mod }  from './module';
import { dataTypes } from '../../entities/dataTypes';

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
    link($scope: ErrorMessagesScope, _element: JQuery, attributes: ErrorMessagesAttributes) {
      $scope.dynamicErrors = errors;
      $scope.$watch(attributes.ngModelController, (ngModelController: INgModelController|INgModelController[]) => {
        $scope.ngModelControllers = normalizeAsArray(ngModelController);
      });
      $scope.isVisible = () => {
        if ($scope.ngModelControllers) {
          for (const ngModel of $scope.ngModelControllers) {
            if (ngModel.$dirty || ngModel.$viewValue) {
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
