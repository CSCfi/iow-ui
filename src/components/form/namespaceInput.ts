import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;

export const mod = angular.module('iow.components.form');

const URL_REGEXP = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;

mod.directive('namespaceInput', () => {
  'ngInject';
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {
      modelController.$validators['namespace'] = (modelValue: string) => {
        return !modelValue || modelValue.endsWith('#') || modelValue.endsWith('/');
      };

      modelController.$validators['url'] = (modelValue: string) => {
        return !modelValue || URL_REGEXP.test(modelValue);
      };
    }
  };
});
