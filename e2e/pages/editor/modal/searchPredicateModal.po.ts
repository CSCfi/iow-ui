import { SearchModal } from '../../common/searchModal.po';
import { SearchConceptModal } from './searchConceptModal.po';
import { KnownPredicateType } from '../../../../src/entities/type';
import { isDefined } from '../../../../src/utils/object';

export class SearchPredicateModal extends SearchModal {

  constructor(public type?: KnownPredicateType) {
    super('search-predicate');
  }

  selectAddNew(type?: KnownPredicateType) {

    if (isDefined(this.type)) {
      if (isDefined(type)) {
        throw new Error('Type must not be defined: ' + this.type);
      }
    } else {
      if (!isDefined(type)) {
        throw new Error('Type must be defined');
      }
    }

    this.selectAddNewResultByIndex(isDefined(this.type) || type === 'attribute' ? 0 : 1);
    return new SearchConceptModal();
  }
}
