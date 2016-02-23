
import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import ITimeoutService = angular.ITimeoutService;
export const mod = angular.module('iow.components.form');

mod.directive('errorMessages', () => {
  return {
    restrict: 'E',
    template: require('./errorMessages.html'),
    link($scope: ErrorMessagesScope, element: JQuery, attributes: ErrorMessagesAttributes) {
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
}
