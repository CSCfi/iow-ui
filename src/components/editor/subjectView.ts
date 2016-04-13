import { FintoConcept, ConceptSuggestion } from '../../services/entities';
import { module as mod }  from './module';

mod.directive('subjectView', () => {
  return {
    scope: {
      subject: '=',
      title: '@'
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
