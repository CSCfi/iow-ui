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
      modelController.$validators['invalidCurie'] = (modelValue: string) => {
        return !modelValue || !!$scope.model.expandCurie(modelValue);
      }
    }
  };
});

interface CurieInputScope extends IScope {
  model: Model;
}
