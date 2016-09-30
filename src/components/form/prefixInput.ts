import { IScope, IAttributes, INgModelController } from 'angular';
import { Model, ImportedNamespace, NamespaceType } from '../../services/entities';
import { isValidPrefixLength, isValidPrefix } from './validators';
import { module as mod }  from './module';

mod.directive('prefixInput', () => {
  return {
    scope: {
      model: '=?',
      activeNamespace: '=?',
      allowTechnical: '=?'
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: PrefixInputScope, _element: JQuery, _attributes: IAttributes, ngModel: INgModelController) {
      ngModel.$validators['prefix'] = isValidPrefix;
      ngModel.$validators['length'] = isValidPrefixLength;
      ngModel.$validators['existingId'] = (prefix: string) => {

        const model = $scope.model;
        const activeNamespace = $scope.activeNamespace;
        const allowTechnical = $scope.allowTechnical;

        if (!model) {
          return true;
        } else {
          for (const modelNamespace of model.getNamespaces()) {
            if (modelNamespace.prefix === prefix) {

              const isTechnical = modelNamespace.type === NamespaceType.IMPLICIT_TECHNICAL;
              const isActiveNamespace = activeNamespace ? activeNamespace.prefix === modelNamespace.prefix : false;

              if (isTechnical && allowTechnical) {
                return true;
              } else {
                return isActiveNamespace;
              }
            }
          }
          return true;
        }
      };
    }
  };
});

interface PrefixInputScope extends IScope {
  model: Model;
  activeNamespace: ImportedNamespace;
  allowTechnical: boolean;
}
