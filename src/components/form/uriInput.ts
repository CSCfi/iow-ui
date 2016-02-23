import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Model, Uri } from '../../services/entities';

export const mod = angular.module('iow.components.form');

mod.directive('uriInput', (gettextCatalog: gettextCatalog) => {
  'ngInject';
  return {
    scope: {
      model: '=',
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: UriInputScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {

      if (!attributes['placeholder']) {
        element.attr('placeholder', gettextCatalog.getString('Write identifier'));
      }

      modelController.$parsers.push((viewValue: string) => {
        return viewValue === '' ? null : new Uri(viewValue, $scope.model.context);
      });

      modelController.$formatters.push((value: Uri) => {
        if (!value) {
          return '';
        } else {
          return value.compact;
        }
      });

      modelController.$validators['uri'] = (modelValue: Uri, viewValue: string) => {
        return !viewValue || new Uri(viewValue, $scope.model.context).hasPrefixForNamespace();
      }
    }
  };
});

interface UriInputScope extends IScope {
  model: Model;
}
