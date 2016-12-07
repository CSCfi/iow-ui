import { Localizer } from '../../services/languageService';
import { module as mod }  from './module';
import { Concept, LegacyConcept } from '../../entities/vocabulary';
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
    controller: ConceptFormController
  };
});

export class ConceptFormController {

  concept: Concept|LegacyConcept;
  model: Model;
  localizer: Localizer;

  isConceptEditable() {
    return this.concept.suggestion;
  }
}
