import { confirm } from '../../modal/modalHelp.po';
import {
  filterForSearchResult, selectSearchResult, focusSearchSelection,
  filterForAddNewResult, selectAddNewResult
} from '../../modal/searchModalHelp.po';
import { modal, child } from '../../../selectors';
import { predicateIdFromNamespaceId } from '../../../utils';
import { KnownPredicateType } from '../../../../entities/type';
import * as SearchConceptModal from './searchConceptModalHelp.po';
import * as PredicateForm from '../predicateFormHelp.po';
import gettextCatalog = angular.gettext.gettextCatalog;

export const searchPredicateModalElement = child(modal, '.search-predicate');

export function filterForPredicate(namespaceId: string, predicateName: string, gettextCatalog: gettextCatalog) {
  return filterForSearchResult(searchPredicateModalElement, predicateName, predicateIdFromNamespaceId(namespaceId, predicateName), gettextCatalog);
}

export function filterForNewPredicate(predicateName: string, gettextCatalog: gettextCatalog) {
  return filterForAddNewResult(searchPredicateModalElement, predicateName, gettextCatalog, "predicate");
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

export function findAndSelectExistingPredicateItems(namespaceId: string, predicateName: string, gettextCatalog: angular.gettext.gettextCatalog) {
  return [
    filterForPredicate(namespaceId, predicateName, gettextCatalog),
    selectPredicate(namespaceId, predicateName),
    focusSelectedAttribute,
    confirmPredicateSelection(true)
  ];
}

export function findAndCreateNewBasedOnSuggestion(name: string, comment: string, navigates: boolean, gettextCatalog: gettextCatalog) {
  return [
    filterForNewPredicate(name, gettextCatalog),
    selectAddNewPredicateSearchResult('association'),
    ...SearchConceptModal.findAndCreateNewSuggestion(name, comment, navigates, gettextCatalog)
  ];
}

export function findAndCreateNewPropertyBasedOnSuggestion(searchName: string, name: string, comment: string, gettextCatalog: gettextCatalog) {
  return [
    ...findAndCreateNewBasedOnSuggestion(searchName, comment, false, gettextCatalog),
    focusSelectedAssociation,
    PredicateForm.enterPredicateLabel(searchPredicateModalElement, 'association', name, gettextCatalog),
    confirmPredicateSelection(true)
  ];
}
