import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Reference, Model } from '../../services/entities';
import { LanguageService } from '../../services/languageService';
import { module as mod }  from './module';

mod.directive('referencesView', () => {
  return {
    scope: {
      model: '='
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
  model: Model;
  opened: {[key: string]: boolean} = {};
  referenceComparator = (reference: Reference) => this.languageService.translate(reference.label, this.model);

  /* @ngInject */
  constructor(private languageService: LanguageService) {
  }

  open(reference: Reference) {
    this.opened[reference.id.uri] = true;
  }
}
