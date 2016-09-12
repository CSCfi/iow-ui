import { IAttributes, IScope, INgModelController } from 'angular';
import { module as mod }  from './module';

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
