import { module as mod }  from './module';
import { IScope, IAttributes, INgModelController, IFormController } from 'angular';

mod.directive('ignoreForm', () => {
  return {
    restrict: 'A',
    require: ['ngModel', '^?form'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [modelController, formController]: [INgModelController, IFormController]) {
      if (formController) {
        formController.$removeControl(modelController);
      }
    }
  };
});
