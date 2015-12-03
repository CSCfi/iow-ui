import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import { pascalCase, camelCase } from 'change-case';
import { ValidatorService } from '../../services/validatorService';
import { Group, Model, Class, Predicate } from '../../services/entities';
import IQService = angular.IQService;

export const mod = angular.module('iow.components.form');

mod.directive('curieInput', () => {
  'ngInject';
  return {
    scope: {
      model: '=',
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: CurieInputScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {
      modelController.$parsers.push(viewValue => {
        return viewValue === '' ? null : viewValue;
      });

      modelController.$validators['invalidCurie'] = (modelValue: string) => {
        if (modelValue) {
          const expanded = $scope.model.expandCurie(modelValue);
          return !!(expanded && expanded.namespace);
        } else {
          return true;
        }
      }
    }
  };
});

interface CurieInputScope extends IScope {
  model: Model;
}
