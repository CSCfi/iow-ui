import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { Model, ReferenceData } from '../../services/entities';
import { EditableForm } from '../form/editableEntityController';
import { SearchReferenceDataModal } from '../model/searchReferenceDataModal';
import { module as mod }  from './module';
import { ViewReferenceDataModal } from '../model/viewReferenceDataModal';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { Localizer, LanguageService } from '../../services/languageService';

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
  referenceData: ReferenceData[];
  model: Model;
  expanded: boolean;
  descriptor: ReferenceDataTableDescriptor;

  /* @ngInject */
  constructor(private searchReferenceDataModal: SearchReferenceDataModal, private languageService: LanguageService, private viewReferenceDataModal: ViewReferenceDataModal) {
    this.descriptor = new ReferenceDataTableDescriptor(this.model, languageService.createLocalizer(this.model), viewReferenceDataModal);
  }

  addReferenceData() {
    this.searchReferenceDataModal.openSelectionForProperty(this.model).then(referenceData => {
      this.expanded = true;
      this.referenceData.push(referenceData);
    });
  }
}

class ReferenceDataTableDescriptor extends TableDescriptor<ReferenceData> {

  constructor(private model: Model, private localizer: Localizer, private viewReferenceDataModal: ViewReferenceDataModal) {
    super();
  }

  columnDescriptors(referenceDatas: ReferenceData[]): ColumnDescriptor<ReferenceData>[] {

    // TODO: shared logic with referenceDatasView.ts
    const clickHandler = (value: ReferenceData) => {
      if (value.isExternal()) {
        window.open(value.id.uri, '_blank');
      } else {
        this.viewReferenceDataModal.open(value, this.model);
      }
    };

    return [
      { headerName: 'Reference data name', nameExtractor: referenceData => this.localizer.translate(referenceData.title), onClick: clickHandler },
      { headerName: 'Description', nameExtractor: referenceData => this.localizer.translate(referenceData.description) }
    ];
  }

  canEdit(referenceData: ReferenceData): boolean {
    return false;
  }

  edit(value: ReferenceData): any {
    throw new Error('Edit unsupported');
  }

  canRemove(referenceData: ReferenceData): boolean {
    return true;
  }

  orderBy(referenceData: ReferenceData): any {
    return referenceData.identifier;
  }
}
