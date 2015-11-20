import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;

export const mod = angular.module('iow.components.form');

mod.directive('idInput', () => {
  'ngInject';
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {
      let prefix = '';

      modelController.$parsers.push(value => {
        return prefix ? (prefix + ':' + value) : value;
      });

      modelController.$formatters.push(value => {
        if (value) {
          const split = value.split(':');
          prefix = split[0];
          return split[1];
        }
      });
    }
  };
});
