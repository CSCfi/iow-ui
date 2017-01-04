import { IAttributes, INgModelController, IScope, IQService } from 'angular';
import { ValidatorService } from '../../services/validatorService';
import {
  isValidLabelLength, isValidIdentifier, isValidClassIdentifier,
  isValidPredicateIdentifier
} from './validators';
import { Uri } from '../../entities/uri';
import { module as mod }  from './module';
import { Class } from '../../entities/class';
import { Predicate } from '../../entities/predicate';
import { extendNgModelOptions } from '../../utils/angular';


interface IdInputAttributes extends IAttributes {
  idInput: 'class' | 'predicate';
}

mod.directive('idInput', /* @ngInject */ ($q: IQService, validatorService: ValidatorService) => {
  return {
    scope: {
      old: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: IdInputScope, _element: JQuery, attributes: IdInputAttributes, modelController: INgModelController) {
      let previous: Uri|null = null;

      extendNgModelOptions(modelController, {
        updateOnDefault: true,
        updateOn: 'blur default',
        debounce: {
          'blur': 0,
          'default': 1000
        }
      });

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

      modelController.$validators['id'] = value => {
        if (attributes.idInput === 'class') {
          return value && isValidClassIdentifier(value.name, attributes.idInput);
        } else if (attributes.idInput === 'predicate') {
          return value && isValidPredicateIdentifier(value.name, attributes.idInput);
        } else {
          return value && isValidIdentifier(value.name, attributes.idInput);
        }
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
