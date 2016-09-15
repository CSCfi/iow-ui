import { module as mod } from './module';
import { IScope, IAttributes } from 'angular';
import { FloatController } from '../common/float';
import { Show } from '../contracts';

interface FloatSizeAdjusterScope extends IScope {
  width: number;
  show: Show;
}

mod.directive('selectionFloatSizeAdjuster', () => {
  return {
    scope: {
      width: '=',
      show: '='
    },
    require: 'float',
    link($scope: FloatSizeAdjusterScope, element: JQuery, attributes: IAttributes, floatController: FloatController) {
      $scope.$watchGroup([() => $scope.width, () => $scope.show, () => floatController.floating], ([width, show, floating]: [number, Show, boolean]) => {
        if (floating) {
          floatController.setWidth(show === Show.Both ? `${width - 1}px` : 'calc(100% - 301px)');
        } else {
          floatController.setWidth('');
        }
      });
    }
  };
});
