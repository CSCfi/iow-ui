import IAttributes = angular.IAttributes;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Model, Concept, SchemeNameHref, ConceptSuggestion, Vocabulary } from '../../services/entities';
import { ConceptViewController } from './conceptView';
import { SearchConceptModal } from '../editor/searchConceptModal';
import { LanguageService, Localizer } from '../../services/languageService';
import { module as mod }  from './module';
import { Uri } from '../../services/uri';

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
  schemes: SchemeNameHref[];
  localizer: Localizer;

  constructor($scope: IScope, private searchConceptModal: SearchConceptModal, private languageService: LanguageService) {
    this.localizer = languageService.createLocalizer(this.model);
    $scope.$watch(() => this.concept, (concept: Concept) => {

      const scheme = concept.inScheme;
      const schemeId = scheme instanceof Vocabulary ? scheme.id : <Uri> scheme;

      for (const reference of this.model.references) {
        if (reference.id.equals(schemeId)) {
          concept.inScheme = reference;
          break;
        }
      }
    });
    $scope.$watch(() => this.concept.inScheme, () => this.schemes = this.concept.getSchemes());
  }

  isSchemeEditable() {
    return this.concept instanceof ConceptSuggestion;
  }

  selectBroaderConcept() {
      this.searchConceptModal.openSelection(this.model.references, this.model)
        .then(concept => this.concept.broaderConcept = concept);
  }
}
