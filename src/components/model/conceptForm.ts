import IAttributes = angular.IAttributes;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Model, Concept, Reference } from '../../services/entities';
import { ConceptViewController } from './conceptView';
import { SearchConceptModal } from '../editor/searchConceptModal';
import { module as mod }  from './module';
import { Uri } from '../../services/uri';
import { LanguageService } from '../../services/languageService';

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

  constructor(private searchConceptModal: SearchConceptModal, private languageService: LanguageService) {
  }

  nameForScheme(scheme: Reference|Uri) {
    if (scheme instanceof Uri) {
      return scheme.uri;
    } else if (scheme instanceof Reference) {
      return this.languageService.translate(scheme.label, this.model);
    } else {
      throw new Error('Unknown scheme type: ' + scheme);
    }
  }

  linkToScheme(scheme: Reference|Uri) {
    if (scheme instanceof Uri) {
      return scheme.uri;
    } else if (scheme instanceof Reference) {
      return scheme.href;
    } else {
      throw new Error('Unknown scheme type: ' + scheme);
    }
  }

  selectBroaderConcept() {
      this.searchConceptModal.openSelection(this.model.references, this.model)
        .then(concept => this.concept.broaderConcept = concept);
  }
}
