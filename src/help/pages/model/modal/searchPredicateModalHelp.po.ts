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
import { Story } from '../../../contract';

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

export function findAndSelectExistingPredicateItems(type: KnownPredicateType, namespaceId: string, predicateName: string, gettextCatalog: angular.gettext.gettextCatalog): Story[] {
  return [
    filterForPredicate(namespaceId, predicateName, gettextCatalog),
    selectPredicate(namespaceId, predicateName),
    type === 'attribute' ? focusSelectedAttribute : focusSelectedAssociation,
    confirmPredicateSelection(true)
  ];
}

export function findAndCreateNewBasedOnSuggestionItems(type: KnownPredicateType, name: string, comment: string, navigates: boolean, gettextCatalog: gettextCatalog): Story[] {
  return [
    filterForNewPredicate(name, gettextCatalog),
    selectAddNewPredicateSearchResult(type),
    ...SearchConceptModal.findAndCreateNewSuggestionItems(name, comment, navigates, gettextCatalog)
  ];
}

export function findAndCreateNewBasedOnExistingConceptItems(type: KnownPredicateType, name: string, conceptId: string, navigates: boolean, gettextCatalog: gettextCatalog): Story[] {
  return [
    filterForNewPredicate(name, gettextCatalog),
    selectAddNewPredicateSearchResult(type),
    ...SearchConceptModal.findAndSelectExistingConceptItems(name, conceptId, navigates, gettextCatalog)
  ];
}

export function findAndCreateNewPropertyBasedOnSuggestionItems(type: KnownPredicateType, searchName: string, name: string, comment: string, gettextCatalog: gettextCatalog): Story[] {
  return [
    ...findAndCreateNewBasedOnSuggestionItems(type, searchName, comment, false, gettextCatalog),
    type === 'attribute' ? focusSelectedAttribute : focusSelectedAssociation,
    PredicateForm.enterPredicateLabel(searchPredicateModalElement, type, name, gettextCatalog),
    confirmPredicateSelection(true)
  ];
}

export function findAndCreateNewPropertyBasedOnExistingConceptItems(type: KnownPredicateType, searchName: string, name: string, conceptId: string, gettextCatalog: gettextCatalog): Story[] {
  return [
    ...findAndCreateNewBasedOnExistingConceptItems(type, searchName, conceptId, false, gettextCatalog),
    type === 'attribute' ? focusSelectedAttribute : focusSelectedAssociation,
    PredicateForm.enterPredicateLabel(searchPredicateModalElement, type, name, gettextCatalog),
    confirmPredicateSelection(true)
  ];
}
