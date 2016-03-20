import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import INgModelController = angular.INgModelController;

export const mod = angular.module('iow.components.form');

mod.directive('input', () => {
  return {
    restrict: 'E',
    require: '?ngModel',
    link($scope: IScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {

      const formGroup = element.closest('.form-group');

      function setClasses(invalid: boolean) {
        if ((modelController.$dirty || modelController.$modelValue) && invalid) {
          formGroup.addClass('has-error');
        } else {
          formGroup.removeClass('has-error');
        }
      }

      if (modelController) {
        $scope.$watch(() => modelController.$invalid, setClasses);
        $scope.$watch(() => modelController.$dirty, () => setClasses(modelController.$invalid));
      }
    }
  };
});
