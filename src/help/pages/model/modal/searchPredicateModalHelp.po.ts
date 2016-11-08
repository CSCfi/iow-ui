import { confirm } from '../../modal/modalHelp.po';
import {
  filterForSearchResult, selectSearchResult, focusSearchSelection,
  filterForAddNewResult, selectAddNewResult
} from '../../modal/searchModalHelp.po';
import { modal, child } from '../../../selectors';
import { predicateIdFromNamespaceId } from '../../../utils';
import { KnownPredicateType } from '../../../../entities/type';
import gettextCatalog = angular.gettext.gettextCatalog;

export const searchPredicateModalElement = child(modal, '.search-predicate');

export function filterForPredicate(namespaceId: string, predicateName: string, gettextCatalog: gettextCatalog) {
  return filterForSearchResult(searchPredicateModalElement, predicateName.toLowerCase(), predicateIdFromNamespaceId(namespaceId, predicateName), gettextCatalog);
}

export function filterForNewPredicate(predicateName: string, gettextCatalog: gettextCatalog) {
  return filterForAddNewResult(searchPredicateModalElement, predicateName, gettextCatalog);
}

export function selectPredicate(namespaceId: string, predicateName: string) {
  return selectSearchResult(searchPredicateModalElement, predicateName, predicateIdFromNamespaceId(namespaceId, predicateName), true);
}

export function selectAddNewPredicateSearchResult(type: KnownPredicateType) {
  return selectAddNewResult(searchPredicateModalElement, type === 'attribute' ? 0 : 1, `Select new ${type} creation`);
}

export const focusSelectedAttribute = focusSearchSelection(searchPredicateModalElement, 'Attribute is here', 'Attribute is here info');
export const focusSelectedAssociation = focusSearchSelection(searchPredicateModalElement, 'Association is here', 'Attribute is here info');

export function confirmPredicateSelection(navigates: boolean) {
 return confirm(searchPredicateModalElement, navigates);
}
