import { Concept, Model, Type } from '../../services/entities';
import { module as mod }  from './module';
import { SearchConceptModal } from './searchConceptModal';
import { EditableForm } from '../form/editableEntityController';
import { IScope, IAttributes } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;

mod.directive('editableConceptSelect', () => {
  return {
    scope: {
      concept: '=',
      model: '=',
      title: '@',
      allowSuggestions: '=',
      type: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    template: require('./editableConceptSelect.html'),
    controller: EditableConceptSelectController,
    require: ['editableConceptSelect', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableConceptSelectController, EditableForm]) {
      thisController.isEditing = () => formController && formController.editing;
    }
  };
});

class EditableConceptSelectController {

  concept: Concept;
  model: Model;
  title: string;
  allowSuggestions: boolean;
  type: Type;

  isEditing: () => boolean;

  constructor(private searchConceptModal: SearchConceptModal) {
  }

  selectConcept() {
    this.searchConceptModal.openSelection(this.model.vocabularies, this.model, this.allowSuggestions, this.type)
      .then(concept => this.concept = concept);
  }

  clearSelection() {
    this.concept = null;
  }
}
