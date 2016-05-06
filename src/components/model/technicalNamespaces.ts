import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Model, NamespaceType, Namespace } from '../../services/entities';
import { module as mod }  from './module';

mod.directive('technicalNamespaces', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./technicalNamespaces.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: TechnicalNamespacesController
  };
});

interface RequiresViewScope extends IScope {
  modelViewController: ModelViewController;
}

const nonExpandedLimit = 5;

class TechnicalNamespacesController {
  model: Model;
  namespaces: Namespace[];
  expanded = false;

  /* @ngInject */
  constructor($scope: IScope) {
    $scope.$watch(() => this.model, model => this.namespaces = model.getNamespaces().filter(ns => ns.type === NamespaceType.IMPLICIT_TECHNICAL));
  }

  get limit() {
    return this.expanded ? null : nonExpandedLimit;
  }

  canExpand() {
    return this.namespaces.length > nonExpandedLimit;
  }

  toggleExpand() {
    this.expanded = !this.expanded;
  }

  get expanderClasses() {
    return [
      'fa',
      {
        'fa-angle-double-down': !this.expanded,
        'fa-angle-double-up': this.expanded
      }
    ];
  }
}
