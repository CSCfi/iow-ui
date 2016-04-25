import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import { EditableEntityController } from './editableEntityController';
import { module as mod }  from './module';

mod.directive('editableEntityButtons', () => {
  return {
    restrict: 'E',
    scope: {
      ctrl: '=editableController',
      languages: '='
    },
    require: '^form',
    template: require('./editableEntityButtons.html'),
    transclude: true,
    link($scope: EditableEntityButtonsScope, element: JQuery, attributes: IAttributes, formController: IFormController) {
      $scope.form = formController;
    }
  };
});

interface EditableEntityButtonsScope extends IScope {
  form: IFormController;
  ctrl: EditableEntityController<any>;
}
