import { IScope, IAttributes, INgModelController } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;

import { module as mod }  from './module';

mod.directive('ignoreDirty', () => {
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {
      modelController.$setPristine = () => {};
      modelController.$pristine = false;
    }
  };
});
