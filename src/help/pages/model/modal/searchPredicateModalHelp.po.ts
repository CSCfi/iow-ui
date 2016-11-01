import { confirm } from '../../modal/modalHelp.po';
import {
  filterForSearchResult, selectSearchResult, focusSearchSelection,
  filterForAddNewResult, selectAddNewResult
} from '../../modal/searchModalHelp.po';
import { modal, child } from '../../../selectors';
import { predicateIdFromNamespaceId } from '../../../utils';
import { KnownPredicateType } from '../../../../entities/type';

export const searchPredicateModalElement = child(modal, '.search-predicate');

export function filterForPredicate(namespaceId: string, predicateName: string, initialSearch: string) {
  return filterForSearchResult(searchPredicateModalElement, predicateName.toLowerCase(), predicateIdFromNamespaceId(namespaceId, predicateName), initialSearch);
}

export function filterForNewPredicate(predicateName: string) {
  return filterForAddNewResult(searchPredicateModalElement, predicateName, predicateName);
}

export function selectPredicate(namespaceId: string, predicateName: string) {
  return selectSearchResult(searchPredicateModalElement, predicateName.toLowerCase(), predicateIdFromNamespaceId(namespaceId, predicateName), true);
}

export function selectAddNewPredicateSearchResult(type: KnownPredicateType) {
  return selectAddNewResult(searchPredicateModalElement, type === 'attribute' ? 0 : 1, `Select new ${type} creation`);
}

export const focusSelectedAttribute = focusSearchSelection(searchPredicateModalElement, 'Attribute is here', 'Diipadaa');
export const focusSelectedAssociation = focusSearchSelection(searchPredicateModalElement, 'Association is here', 'Diipadaa');

export function confirmPredicateSelection(navigates: boolean) {
 return confirm(searchPredicateModalElement, navigates);
}
