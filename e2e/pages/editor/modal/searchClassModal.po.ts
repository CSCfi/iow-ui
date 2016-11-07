import { SearchModal } from '../../common/searchModal.po';
import { SearchConceptModal } from './searchConceptModal.po';

export class SearchClassModal extends SearchModal {

  constructor() {
    super('search-class');
  }

  selectAddNew() {
    this.selectAddNewResultByIndex(0);
    return new SearchConceptModal();
  }
}
