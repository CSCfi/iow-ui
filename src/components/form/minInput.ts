import { IScope, IAttributes, INgModelController } from 'angular';
import { isDefined } from '../../utils/object';
import { module as mod }  from './module';

mod.directive('minInput', () => {
  return {
    scope: {
      max: '='
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
