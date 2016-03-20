
import { FintoConcept, ConceptSuggestion } from "../../services/entities";

export const mod = angular.module('iow.components.editor');

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
}
