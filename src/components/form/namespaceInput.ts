import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import { Model, Require } from '../../services/entities';
import { isValidNamespace, isValidUrl } from './validators';

export const mod = angular.module('iow.components.form');

mod.directive('namespaceInput', () => {
  return {
    scope: {
      model: '=?',
      activeRequire: '=?'
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: NamespaceInputScope, element: JQuery, attributes: IAttributes, ngModel: INgModelController) {
      ngModel.$validators['namespace'] = isValidNamespace;
      ngModel.$validators['url'] = isValidUrl;
      ngModel.$validators['existingId'] = (ns: string) => {
        const model = $scope.model;
        return !model || !model.getNamespaceNames($scope.activeRequire).has(ns);
      };
    }
  };
});

interface NamespaceInputScope extends IScope {
  model: Model;
  activeRequire: Require;
}
