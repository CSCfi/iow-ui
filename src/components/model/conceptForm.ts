import IAttributes = angular.IAttributes;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Model, Concept } from '../../services/entities';
import { ConceptViewController } from './conceptView';
import { SearchConceptModal } from '../editor/searchConceptModal';
import { module as mod }  from './module';

mod.directive('conceptForm', () => {
  return {
    scope: {
      concept: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./conceptForm.html'),
    require: ['conceptForm', '?^conceptView'],
    controllerAs: 'ctrl',
    bindToController: true,
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, classViewController]: [ConceptFormController, ConceptViewController]) {
      thisController.isEditing = () => classViewController && classViewController.isEditing();
    },
    controller: ConceptFormController
  };
});

export class ConceptFormController {

  concept: Concept;
  model: Model;
  isEditing: () => boolean;

  constructor(private searchConceptModal: SearchConceptModal) {
  }

  selectBroaderConcept() {
      this.searchConceptModal.openSelection(this.model.references, this.model)
        .then(concept => this.concept.broaderConcept = concept);
  }
}
