import { IAttributes, IScope } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { ConceptViewController } from './conceptView';
import { LanguageService, Localizer } from '../../services/languageService';
import { module as mod }  from './module';
import { Uri } from '../../services/uri';
import { Concept, VocabularyNameHref, ConceptSuggestion, Vocabulary } from '../../entities/vocabulary';
import { Model } from '../../entities/model';

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
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, classViewController]: [ConceptFormController, ConceptViewController]) {
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

  constructor($scope: IScope, languageService: LanguageService, public gettextCatalog: gettextCatalog) {
    this.localizer = languageService.createLocalizer(this.model);
    $scope.$watch(() => this.concept, (concept: Concept) => {
      if (concept instanceof ConceptSuggestion) {
        const vocabulary = concept.vocabulary;
        const vocabularyId = vocabulary instanceof Vocabulary ? vocabulary.id : <Uri> vocabulary;

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

  isConceptEditable() {
    return this.concept instanceof ConceptSuggestion;
  }
}
