import { confirm } from '../../modal/modalHelp.po';
import {
  filterForSearchResult, selectSearchResult, focusSearchSelection,
  filterForAddNewResult, selectAddNewResult
} from '../../modal/searchModalHelp.po';
import { modal, child } from '../../../selectors';
import { classIdFromNamespaceId } from '../../../utils';
import * as SearchConceptModal from './searchConceptModalHelp.po';
import gettextCatalog = angular.gettext.gettextCatalog;

const searchClassModal = child(modal, '.search-class');

export function filterForClass(namespaceId: string, className: string, gettextCatalog: gettextCatalog) {
  return filterForSearchResult(searchClassModal, className, classIdFromNamespaceId(namespaceId, className), gettextCatalog);
}

export function filterForNewClass(className: string, gettextCatalog: gettextCatalog) {
  return filterForAddNewResult(searchClassModal, className, gettextCatalog, "class");
}

export function selectClass(namespaceId: string, className: string) {
  return selectSearchResult(searchClassModal, className, classIdFromNamespaceId(namespaceId, className), true);
}

export const selectAddNewClassSearchResult = selectAddNewResult(searchClassModal, 0, 'Select new creation');

export const focusSelectedClass = focusSearchSelection(searchClassModal, 'Class is here', 'Class is here info');

export const confirmClassSelection = (navigates: boolean) => confirm(searchClassModal, navigates);

export function findAndSelectExistingClassItems(namespaceId: string, className: string, navigates: boolean, gettextCatalog: angular.gettext.gettextCatalog) {
  return [
    filterForClass(namespaceId, className, gettextCatalog),
    selectClass(namespaceId, className),
    focusSelectedClass,
    confirmClassSelection(navigates)
  ];
}

export function findAndCreateNewBasedOnConceptSuggestion(name: string, comment: string, gettextCatalog: gettextCatalog) {
  return [
    filterForNewClass(name, gettextCatalog),
    selectAddNewClassSearchResult,
    ...SearchConceptModal.findAndCreateNewSuggestion(name, comment, true, gettextCatalog)
  ];
}
