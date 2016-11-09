import { SearchModal } from '../../common/searchModal.po';
import { SearchConceptModal } from './searchConceptModal.po';
import { EditableComponent } from '../../common/component/editableComponent.po';

export class SearchClassModal extends SearchModal {

  externalIdElement: EditableComponent;

  constructor() {
    super('search-class');
    this.externalIdElement = EditableComponent.byTitleLocalizationKey(this.element, 'External URI')
  }

  selectAddNew() {
    this.selectAddNewResultByIndex(0);
    return new SearchConceptModal();
  }

  selectAddNewExternal() {
    this.selectAddNewResultByIndex(1);
  }
}
