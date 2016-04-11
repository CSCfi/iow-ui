import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Relation, Model } from '../../services/entities';
import { module as mod }  from './module';

mod.directive('relationsView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./relationsView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['relationsView', '?^modelView'],
    link($scope: RelationsViewScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [RelationsViewController, ModelViewController]) {
      if (modelViewController) {
        $scope.modelViewController = modelViewController;
        $scope.modelViewController.registerRelationsView(thisController);
      }
      thisController.isEditing = () => modelViewController ? modelViewController.isEditing() : false;
    },
    controller: RelationsViewController
  };
});

interface RelationsViewScope extends IScope {
  modelViewController: ModelViewController;
}

class RelationsViewController {
  model: Model;
  opened: {[key: number]: boolean} = {};
  isEditing: () => boolean;

  open(relation: Relation) {
    this.opened[this.model.relations.indexOf(relation)] = true;
  }
}
