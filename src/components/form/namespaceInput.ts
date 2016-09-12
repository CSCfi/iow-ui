import { IScope, IAttributes, INgModelController } from 'angular';
import { Model, ImportedNamespace } from '../../services/entities';
import { isValidNamespace, isValidUrl } from './validators';
import { module as mod }  from './module';

mod.directive('namespaceInput', () => {
  return {
    scope: {
      model: '=?',
      activeNamespace: '=?'
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: NamespaceInputScope, element: JQuery, attributes: IAttributes, ngModel: INgModelController) {
      ngModel.$validators['namespace'] = isValidNamespace;
      ngModel.$validators['url'] = isValidUrl;
      ngModel.$validators['existingId'] = (ns: string) => {
        const model = $scope.model;
        return !model || !model.getNamespaceNames($scope.activeNamespace).has(ns);
      };
    }
  };
});

interface NamespaceInputScope extends IScope {
  model: Model;
  activeNamespace: ImportedNamespace;
}
