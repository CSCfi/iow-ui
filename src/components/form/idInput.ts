import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import IQService = angular.IQService;
import { ValidatorService } from '../../services/validatorService';
import { Class, Predicate, Type, Uri } from '../../services/entities';
import { isStringValid, isValidLabelLength } from './validators';

export const mod = angular.module('iow.components.form');

interface IdInputAttributes extends IAttributes {
  idInput: Type;
}

mod.directive('idInput', ($q: IQService, validatorService: ValidatorService) => {
  'ngInject';
  return {
    scope: {
      old: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: IdInputScope, element: JQuery, attributes: IdInputAttributes, modelController: INgModelController) {
      let previous: Uri = null;

      const updateOnBlur = { updateOn: 'blur' };

      if (modelController.$options) {
        _.assign(modelController.$options, updateOnBlur);
      } else {
        modelController.$options = updateOnBlur;
      }

      modelController.$parsers.push((value: string) => {
        // doesn't handle scenario without initial Uri
        return previous ? previous.withName(value) : null;
      });

      modelController.$formatters.push((value: Uri) => {
        if (value) {
          previous = value;
          return value.name;
        }
      });

      modelController.$asyncValidators['existingId'] = (modelValue: Uri) => {
        if ($scope.old.unsaved || $scope.old.id.notEquals(modelValue)) {
          if (attributes.idInput === 'class') {
            return validatorService.classDoesNotExist(modelValue);
          } else if (attributes.idInput === 'predicate') {
            return validatorService.predicateDoesNotExist(modelValue);
          } else {
            throw new Error('Unknown type: ' + attributes.idInput);
          }
        } else {
          return $q.when(true);
        }
      };

      modelController.$validators['string'] = value => {
        return value && isStringValid(value.name);
      };

      modelController.$validators['length'] = value => {
        return value && isValidLabelLength(value.name);
      };
    }
  };
});

interface IdInputScope extends IScope {
  old: Class|Predicate;
}
