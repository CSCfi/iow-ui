import { confirm } from '../../modal/modalHelp.po';
import {
  filterForSearchResult, selectSearchResult, focusSearchSelection
} from '../../modal/searchModalHelp.po';
import { modal, child } from '../../../selectors';
import { predicateIdFromPrefixAndName } from '../../../utils';

const searchPredicateModal = child(modal, '.search-predicate');

export function filterForPredicate(modelPrefix: string, predicateName: string, initialSearch: string) {
  return filterForSearchResult(searchPredicateModal, predicateName.toLowerCase(), predicateIdFromPrefixAndName(modelPrefix, predicateName), initialSearch);
}

export function selectPredicate(modelPrefix: string, predicateName: string) {
  return selectSearchResult(searchPredicateModal, predicateName.toLowerCase(), predicateIdFromPrefixAndName(modelPrefix, predicateName), true);
}

export const focusSelectedPredicate = focusSearchSelection(searchPredicateModal, 'Predicate is here', 'Diipadaa');

export function confirmPredicateSelection(navigates: boolean) {
 return confirm(searchPredicateModal, navigates);
}
