import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { EditableForm } from '../form/editableEntityController';
import { SearchConceptModal } from './searchConceptModal';
import { Concept, ConceptSuggestion, Reference, Type } from '../../services/entities';

export const mod = angular.module('iow.components.editor');


mod.directive('editableSubjectSelect', () => {
  'ngInject';
  return {
    scope: {
      subject: '=',
      references: '=',
      type: '@'
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableSubjectSelect.html'),
    require: '?^form',
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, formController: EditableForm) {
      $scope.formController = formController;
    },
    controller: EditableSubjectSelectController
  }
});

interface EditableScope extends IScope {
  formController: EditableForm;
}

class EditableSubjectSelectController {

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
