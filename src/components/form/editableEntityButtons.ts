import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
export const mod = angular.module('iow.components.form');

mod.directive('editableEntityButtons', () => {
  return {
    restrict: 'E',
    scope: {
      ctrl: '=editableController'
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
}
