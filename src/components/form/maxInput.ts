import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;

export const mod = angular.module('iow.components.form');

mod.directive('maxInput', () => {
  return {
    scope: {
      min: '=',
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: MaxInputScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {
      modelController.$validators['negative'] = (value: number) => {
        return value >= 0;
      };
      modelController.$validators['lessThanMin'] = (value: number) => {
        return !$scope.min || value >= $scope.min;
      };
    }
  };
});

interface MaxInputScope extends IScope {
  min: number;
}
