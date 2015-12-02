import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;

export const mod = angular.module('iow.components.form');

mod.directive('namespaceInput', () => {
  'ngInject';
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {
      modelController.$validators['invalidNamespace'] = (modelValue: string) => {
        return !modelValue || modelValue.endsWith('#') || modelValue.endsWith('/');
      }
    }
  };
});
