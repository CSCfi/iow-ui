import { IScope, IAttributes, INgModelController } from 'angular';
import { Model, ImportedNamespace } from '../../services/entities';
import { isValidPrefixLength, isValidPrefix } from './validators';
import { module as mod }  from './module';

mod.directive('prefixInput', () => {
  return {
    scope: {
      model: '=?',
      activeNamespace: '=?'
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: PrefixInputScope, element: JQuery, attributes: IAttributes, ngModel: INgModelController) {
      ngModel.$validators['prefix'] = isValidPrefix;
      ngModel.$validators['length'] = isValidPrefixLength;
      ngModel.$validators['existingId'] = (prefix: string) => {
        const model = $scope.model;
        return !model || !model.getPrefixNames($scope.activeNamespace).has(prefix);
      };
    }
  };
});

interface PrefixInputScope extends IScope {
  model: Model;
  activeNamespace: ImportedNamespace;
}
