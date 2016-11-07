import { SearchModal } from '../../common/searchModal.po';
import { SearchConceptModal } from './searchConceptModal.po';
import { KnownPredicateType } from '../../../../src/entities/type';

export class SearchPredicateModal extends SearchModal {

  constructor(public type: KnownPredicateType) {
    super('search-predicate');
  }

  selectAddNew() {
    this.selectAddNewResultByIndex(0);
    return new SearchConceptModal();
  }
}
