import { SearchModal } from '../../common/searchModal.po';
import { SearchConceptModal } from './searchConceptModal.po';
import { KnownPredicateType } from '../../../../src/entities/type';
import { isDefined, assertNever } from '../../../../src/utils/object';
import { EditableComponent } from '../../common/component/editableComponent.po';

export class SearchPredicateModal extends SearchModal {

  externalIdElement: EditableComponent;

  constructor(public type?: KnownPredicateType) {
    super('search-predicate');
    this.externalIdElement = EditableComponent.byTitleLocalizationKey(this.element, 'External URI')
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

    function resolveAddNewIndex() {

      const t = type!;

      switch (t) {
        case 'attribute':
          return 0;
        case 'association':
          return 1;
        default:
          return assertNever(t);
      }
    }

    this.selectAddNewResultByIndex(isDefined(this.type) ? 0 : resolveAddNewIndex());
    return new SearchConceptModal();
  }

  selectAddNewExternal() {
    this.selectAddNewResultByIndex(2);
  }
}
