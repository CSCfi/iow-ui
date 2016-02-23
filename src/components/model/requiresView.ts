import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Require } from '../../services/entities';

export const mod = angular.module('iow.components.model');

mod.directive('requiresView', () => {
  return {
    scope: {
      requires: '='
    },
    restrict: 'E',
    template: require('./requiresView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['requiresView', '?^modelView'],
    link($scope: RequiresViewScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [RequiresViewController, ModelViewController]) {
      if (modelViewController) {
        $scope.modelViewController = modelViewController;
        $scope.modelViewController.registerRequiresView(thisController);
      }
    },
    controller: RequiresViewController
  };
});

interface RequiresViewScope extends IScope {
  modelViewController: ModelViewController;
}

class RequiresViewController {
  requires: Require[];
  opened: {[key: number]: boolean} = {};

  open(require: Require) {
    this.opened[this.requires.indexOf(require)] = true;
  }
}
