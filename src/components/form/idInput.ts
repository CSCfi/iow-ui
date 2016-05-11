import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import IQService = angular.IQService;
import { ValidatorService } from '../../services/validatorService';
import { Class, Predicate, Type } from '../../services/entities';
import { isStringValid, isValidLabelLength } from './validators';
import { Uri } from '../../services/uri';
import { extendNgModelOptions } from '../../utils/angular';
import { module as mod }  from './module';


interface IdInputAttributes extends IAttributes {
  idInput: Type;
}

mod.directive('idInput', /* @ngInject */ ($q: IQService, validatorService: ValidatorService) => {
  return {
    scope: {
      old: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: IdInputScope, element: JQuery, attributes: IdInputAttributes, modelController: INgModelController) {
      let previous: Uri = null;

      extendNgModelOptions(modelController, { updateOn: 'blur' });

      modelController.$parsers.push((value: string) => {
        // doesn't handle scenario without initial Uri
        return previous ? previous.withName(value) : null;
      });

      modelController.$formatters.push((value: Uri) => {
        if (value) {
          previous = value;
          return value.name;
        } else {
          return undefined;
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
