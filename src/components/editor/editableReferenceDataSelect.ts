import { IScope, IAttributes } from 'angular';
import { Model, ReferenceData } from '../../services/entities';
import { EditableForm } from '../form/editableEntityController';
import { SearchReferenceDataModal } from '../model/searchReferenceDataModal';
import { module as mod }  from './module';
import { ViewReferenceDataModal } from '../model/viewReferenceDataModal';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { Localizer, LanguageService } from '../../services/languageService';
import { collectProperties } from '../../utils/array';
import { createExistsExclusion } from '../../utils/exclusion';
import * as _ from 'lodash';

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
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableReferenceDataSelectController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableReferenceDataSelectController
  };
});

class EditableReferenceDataSelectController {

  isEditing: () => boolean;
  referenceData: ReferenceData[];
  model: Model;
  expanded: boolean;
  descriptor: ReferenceDataTableDescriptor;

  /* @ngInject */
  constructor($scope: IScope, private searchReferenceDataModal: SearchReferenceDataModal, private languageService: LanguageService, private viewReferenceDataModal: ViewReferenceDataModal) {
    $scope.$watch(() => this.referenceData, referenceData => {
      this.descriptor = new ReferenceDataTableDescriptor(referenceData, this.model, languageService.createLocalizer(this.model), viewReferenceDataModal);
    });
  }

  addReferenceData() {
    const exclude = createExistsExclusion(collectProperties(this.referenceData, rd => rd.id.uri));

    this.searchReferenceDataModal.openSelectionForProperty(this.model, exclude).then(referenceData => {
      this.expanded = true;
      this.referenceData.push(referenceData);
    });
  }
}

class ReferenceDataTableDescriptor extends TableDescriptor<ReferenceData> {

  constructor(private referenceData: ReferenceData[], private model: Model, private localizer: Localizer, private viewReferenceDataModal: ViewReferenceDataModal) {
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

  values(): ReferenceData[] {
    return this.referenceData;
  }

  canEdit(referenceData: ReferenceData): boolean {
    return false;
  }

  edit(referenceData: ReferenceData): any {
    throw new Error('Edit unsupported');
  }

  remove(referenceData: ReferenceData): any {
    _.remove(this.values(), referenceData);
  }

  canRemove(referenceData: ReferenceData): boolean {
    return true;
  }

  orderBy(referenceData: ReferenceData): any {
    return referenceData.identifier;
  }
}
