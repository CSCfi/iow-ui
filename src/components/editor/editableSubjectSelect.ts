import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { SearchConceptModal } from './searchConceptModal';
import { Concept, ConceptSuggestion, Reference, Type } from '../../services/entities';

export const mod = angular.module('iow.components.editor');


mod.directive('editableSubjectSelect', () => {
  'ngInject';
  return {
    scope: {
      subject: '=',
      references: '=',
      type: '@',
      disable: '=',
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableSubjectSelect.html'),
    require: ['editableSubjectSelect', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      const editableSubjectSelectController = controllers[0];
      editableSubjectSelectController.isEditing = () => controllers[1].editing;
    },
    controller: EditableSubjectSelectController
  }
});

class EditableSubjectSelectController {

  isEditing: () => boolean;
  subject: Concept|ConceptSuggestion;
  references: Reference[];
  type: Type;

  /* @ngInject */
  constructor(private searchConceptModal: SearchConceptModal) {
  }

  selectSubject() {
    this.searchConceptModal.openSelection(this.references, this.type).then(concept => this.subject = concept);
  }
}
