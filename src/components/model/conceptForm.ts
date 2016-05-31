import IAttributes = angular.IAttributes;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Model, Concept, VocabularyNameHref, ConceptSuggestion, ImportedVocabulary } from '../../services/entities';
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
  vocabularyNames: VocabularyNameHref[];
  localizer: Localizer;

  constructor($scope: IScope, private searchConceptModal: SearchConceptModal, private languageService: LanguageService) {
    this.localizer = languageService.createLocalizer(this.model);
    $scope.$watch(() => this.concept, (concept: Concept) => {
      if (concept instanceof ConceptSuggestion) {
        const vocabulary = concept.vocabulary;
        const vocabularyId = vocabulary instanceof ImportedVocabulary ? vocabulary.id : <Uri> vocabulary;

        for (const vocabulary of this.model.vocabularies) {
          if (vocabulary.id.equals(vocabularyId)) {
            concept.vocabulary = vocabulary;
            break;
          }
        }
      }

      this.vocabularyNames = concept.getVocabularyNames();
    });
  }

  isSchemeEditable() {
    return this.concept instanceof ConceptSuggestion;
  }

  selectBroaderConcept() {
      this.searchConceptModal.openSelection(this.model.vocabularies, this.model)
        .then(concept => this.concept.broaderConcept = concept);
  }
}
