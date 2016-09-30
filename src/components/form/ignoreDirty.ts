import { IScope, IAttributes, INgModelController } from 'angular';

import { module as mod }  from './module';

mod.directive('ignoreDirty', () => {
  return {
    restrict: 'A',
    require: 'ngModel',
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, modelController: INgModelController) {
      modelController.$setPristine = () => {};
      modelController.$pristine = false;
    }
  };
});
