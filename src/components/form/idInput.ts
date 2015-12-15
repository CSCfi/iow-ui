import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import IQService = angular.IQService;
import { ValidatorService } from '../../services/validatorService';
import { Group, Model, Class, Predicate, Type } from '../../services/entities';
import { splitCurie } from '../../services/utils';
import { isStringValid, isValidLabelLength } from './stringInput';

export const mod = angular.module('iow.components.form');

function curieValue(curie: string, predicate: (value: string) => boolean) {
  if (curie) {
    const split = splitCurie(curie);
    if (split) {
      return predicate(split.value);
    }
  }
  return true;
}

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
      let prefix = '';

      const updateOnBlur = { updateOn: 'blur' };

      if (modelController.$options) {
        _.assign(modelController.$options, updateOnBlur);
      } else {
        modelController.$options = updateOnBlur;
      }

      modelController.$parsers.push(value => {
        return prefix ? (prefix + ':' + value) : value;
      });

      modelController.$formatters.push(value => {
        const split = splitCurie(value);
        if (split) {
          prefix = split.prefix;
          return split.value;
        }
      });

      modelController.$asyncValidators['existingId'] = (modelValue: string) => {
        if ($scope.old.unsaved || $scope.old.curie !== modelValue) {
          const expanded = $scope.old.expandCurie(modelValue);

          if (attributes.idInput === 'class') {
            return validatorService.classDoesNotExist(expanded);
          } else if (attributes.idInput === 'predicate') {
            return validatorService.predicateDoesNotExist(expanded);
          } else {
            throw new Error('Unknown type: ' + attributes.idInput);
          }
        } else {
          return $q.when(true);
        }
      };

      modelController.$validators['string'] = value => {
        return curieValue(value, isStringValid);
      };

      modelController.$validators['length'] = value => {
        return curieValue(value, isValidLabelLength);
      };
    }
  };
});

interface IdInputScope extends IScope {
  old: Class|Predicate;
}
