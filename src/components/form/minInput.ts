import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { isDefined } from '../../services/utils';

export const mod = angular.module('iow.components.form');

mod.directive('minInput', () => {
  return {
    scope: {
      max: '=',
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: MinInputScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {

      $scope.$watch(() => $scope.max, () => modelController.$validate());

      modelController.$validators['negative'] = (value: number) => {
        return !isDefined(value) || value >= 0;
      };

      modelController.$validators['greaterThanMax'] = (value: number) => {
        return !isDefined(value) || !isDefined($scope.max) || value <= $scope.max;
      };
    }
  };
});

interface MinInputScope extends IScope {
  max: number;
}
