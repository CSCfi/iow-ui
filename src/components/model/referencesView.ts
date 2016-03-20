import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Reference } from '../../services/entities';

export const mod = angular.module('iow.components.model');

mod.directive('referencesView', () => {
  return {
    scope: {
      references: '='
    },
    restrict: 'E',
    template: require('./referencesView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['referencesView', '?^modelView'],
    link($scope: ReferencesViewScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [ReferencesViewController, ModelViewController]) {
      if (modelViewController) {
        $scope.modelViewController = modelViewController;
        $scope.modelViewController.registerReferencesView(thisController);
      }
    },
    controller: ReferencesViewController
  };
});

interface ReferencesViewScope extends IScope {
  modelViewController: ModelViewController;
}

class ReferencesViewController {
  references: Reference[];
  opened: {[key: string]: boolean} = {};

  open(reference: Reference) {
    this.opened[reference.id.uri] = true;
  }
}
