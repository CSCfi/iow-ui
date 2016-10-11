import { IScope, IAttributes, INgModelController } from 'angular';
import { isValidNamespace, isValidUrl } from './validators';
import { module as mod }  from './module';
import { NamespaceType, Model, ImportedNamespace } from '../../entities/model';

mod.directive('namespaceInput', () => {
  return {
    scope: {
      model: '=?',
      activeNamespace: '=?',
      allowTechnical: '=?'
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: NamespaceInputScope, _element: JQuery, _attributes: IAttributes, ngModel: INgModelController) {
      ngModel.$validators['namespace'] = isValidNamespace;
      ngModel.$validators['url'] = isValidUrl;
      ngModel.$validators['existingId'] = (ns: string) => {

        const model = $scope.model;
        const activeNamespace = $scope.activeNamespace;
        const allowTechnical = $scope.allowTechnical;

        if (!model) {
          return true;
        } else {
          for (const modelNamespace of model.getNamespaces()) {
            if (modelNamespace.url === ns) {

              const isTechnical = modelNamespace.type === NamespaceType.IMPLICIT_TECHNICAL;
              const isActiveNamespace = activeNamespace ? activeNamespace.namespace === modelNamespace.url : false;

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

interface NamespaceInputScope extends IScope {
  model: Model;
  activeNamespace: ImportedNamespace;
  allowTechnical: boolean;
}
