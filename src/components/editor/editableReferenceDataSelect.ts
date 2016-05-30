import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { Model, ReferenceData } from '../../services/entities';
import { EditableForm } from '../form/editableEntityController';
import { SearchReferenceDataModal } from '../model/searchReferenceDataModal';
import { module as mod }  from './module';
import { ViewReferenceDataModal } from '../model/viewReferenceDataModal';

mod.directive('editableReferenceDataSelect', () => {
  return {
    scope: {
      referenceData: '=',
      model: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableReferenceDataSelect.html'),
    require: ['editableReferenceDataSelect', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableCodeSchemeSelectController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableCodeSchemeSelectController
  };
});

class EditableCodeSchemeSelectController {

  isEditing: () => boolean;
  referenceData: ReferenceData;
  model: Model;

  /* @ngInject */
  constructor(private searchCodeSchemeModal: SearchReferenceDataModal, private viewReferenceDataModal: ViewReferenceDataModal) {
  }

  browse() {
    if (this.referenceData.isExternal()) {
      window.open(this.referenceData.id.uri, '_blank');
    } else {
      this.viewReferenceDataModal.open(this.referenceData, this.model);
    }
  }

  selectReferenceData() {
    this.searchCodeSchemeModal.openSelectionForProperty(this.model).then(referenceData => this.referenceData = referenceData);
  }

  removeReferenceData() {
    this.referenceData = null;
  }
}
