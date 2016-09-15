import { IScope, IAttributes, IFormController } from 'angular';
import { EditableEntityController } from './editableEntityController';
import { module as mod }  from './module';
import { FloatController } from '../common/float';

mod.directive('editableEntityButtons', () => {
  return {
    restrict: 'E',
    scope: {
      ctrl: '=editableController',
      context: '=',
      width: '='
    },
    require: ['^form', '?^float'],
    template: require('./editableEntityButtons.html'),
    transclude: true,
    link($scope: EditableEntityButtonsScope, element: JQuery, attributes: IAttributes, [formController, floatController]: [IFormController, FloatController]) {
      if (floatController) {
        $scope.$watchGroup([() => $scope.width, () => floatController.floating], ([width, floating]: [number, boolean]) => {
          floatController.setWidth((floating && width && width - 1) || '');
        });
      }
      $scope.form = formController;
    }
  };
});

interface EditableEntityButtonsScope extends IScope {
  form: IFormController;
  ctrl: EditableEntityController<any>;
  width?: number;
}
