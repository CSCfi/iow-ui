import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;

export const mod = angular.module('iow.components.form');

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
