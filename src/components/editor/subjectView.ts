import { FintoConcept, ConceptSuggestion, LanguageContext } from '../../services/entities';
import { module as mod }  from './module';

mod.directive('subjectView', () => {
  return {
    scope: {
      subject: '=',
      title: '@',
      context: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    controller: SubjectViewController,
    template: require('./subjectView.html')
  };
});

class SubjectViewController {
  subject: FintoConcept|ConceptSuggestion;
  title: string;
  context: LanguageContext;

  get subjectTitle() {
    if (this.title) {
      return this.title;
    } else if (!this.subject) {
      return 'Concept';
    } else {
      return this.subject.suggestion ? 'Concept suggestion' : 'Concept';
    }
  }
}
