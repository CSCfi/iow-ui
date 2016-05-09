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
  descriptor: TechnicalNamespaceDescriptor;
  expanded = false;

  /* @ngInject */
  constructor($scope: IScope) {
    this.descriptor = new TechnicalNamespaceDescriptor();
    $scope.$watch(() => this.model, model => this.namespaces = model.getNamespaces().filter(ns => ns.type === NamespaceType.IMPLICIT_TECHNICAL));
  }
}

class TechnicalNamespaceDescriptor extends TableDescriptor<Namespace> {

  columnDescriptors(values: Namespace[]): ColumnDescriptor<Namespace>[] {
    return [
      new ColumnDescriptor('Prefix', (ns: Namespace) => ns.prefix, 'prefix'),
      new ColumnDescriptor('Namespace', (ns: Namespace) => ns.url)
    ];
  }

  canEdit(value: Namespace): boolean {
    return false;
  }

  canRemove(value: Namespace): boolean {
    return false;
  }

  trackBy(value: Namespace): any {
    return value.url;
  }
}
