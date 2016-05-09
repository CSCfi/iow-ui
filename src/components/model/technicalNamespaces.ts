import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { Model, NamespaceType, Namespace } from '../../services/entities';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { module as mod }  from './module';

mod.directive('technicalNamespaces', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: `
      <h4 translate>Technical namespaces</h4>
      <editable-table descriptor="ctrl.descriptor" values="ctrl.namespaces" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    controller: TechnicalNamespacesController
  };
});

class TechnicalNamespacesController {
  model: Model;
  namespaces: Namespace[];
  descriptor: TechnicalNamespaceTableDescriptor;
  expanded = false;

  /* @ngInject */
  constructor($scope: IScope) {
    this.descriptor = new TechnicalNamespaceTableDescriptor();
    $scope.$watch(() => this.model, model => this.namespaces = model.getNamespaces().filter(ns => ns.type === NamespaceType.IMPLICIT_TECHNICAL));
  }
}

class TechnicalNamespaceTableDescriptor extends TableDescriptor<Namespace> {

  columnDescriptors(values: Namespace[]): ColumnDescriptor<Namespace>[] {
    return [
      { headerName: 'Prefix', nameExtractor: ns => ns.prefix, cssClass: 'prefix' },
      { headerName: 'Namespace', nameExtractor: ns => ns.url }
    ];
  }

  orderBy(ns: Namespace) {
    return ns.prefix;
  }

  canEdit(ns: Namespace): boolean {
    return false;
  }

  canRemove(ns: Namespace): boolean {
    return false;
  }
}
