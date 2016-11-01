import { confirm } from '../../modal/modalHelp.po';
import {
  filterForSearchResult, selectSearchResult, focusSearchSelection,
  filterForAddNewResult, selectAddNewResult
} from '../../modal/searchModalHelp.po';
import { modal, child } from '../../../selectors';
import { classIdFromNamespaceId } from '../../../utils';

const searchClassModal = child(modal, '.search-class');

export function filterForClass(namespaceId: string, className: string, initialSearch: string) {
  return filterForSearchResult(searchClassModal, className.toLowerCase(), classIdFromNamespaceId(namespaceId, className), initialSearch);
}

export function filterForNewClass(className: string) {
  return filterForAddNewResult(searchClassModal, className, className);
}

export function selectClass(namespaceId: string, className: string) {
  return selectSearchResult(searchClassModal, className.toLowerCase(), classIdFromNamespaceId(namespaceId, className), true);
}

export const selectAddNewClassSearchResult = selectAddNewResult(searchClassModal, 0, 'Select new creation');

export const focusSelectedClass = focusSearchSelection(searchClassModal, 'Class is here', 'Diipadaa');

export const confirmClassSelection = (navigates: boolean) => confirm(searchClassModal, navigates);
