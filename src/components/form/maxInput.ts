import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { isDefined } from '../../services/utils';

import { module as mod }  from './module';

mod.directive('maxInput', () => {
  return {
    scope: {
      min: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: MaxInputScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {

      $scope.$watch(() => $scope.min, () => modelController.$validate());

      modelController.$validators['negative'] = (value: number) => {
        return !isDefined(value) || value >= 0;
      };
      modelController.$validators['lessThanMin'] = (value: number) => {
        return !isDefined(value) || !isDefined($scope.min) || value >= $scope.min;
      };
    }
  };
});

interface MaxInputScope extends IScope {
  min: number;
}
