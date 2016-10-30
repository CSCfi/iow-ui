import { confirm } from '../../modal/modalHelp.po';
import {
  filterForSearchResult, selectSearchResult, focusSearchSelection,
  textSearchElement, searchResultsElement
} from '../../modal/searchModalHelp.po';
import { modal, child, first } from '../../../selectors';
import {
  createStory, createExpectedStateNextCondition,
  createClickNextCondition, createScrollWithElement
} from '../../../contract';
import { initialInputValue, inputHasExactValue, classIdFromPrefixAndName } from '../../../utils';

const searchClassModal = child(modal, '.search-class');
const searchClassModalTextSearchElement = textSearchElement(searchClassModal);
const searchClassResultsElement = searchResultsElement(searchClassModal);

export function filterForClass(modelPrefix: string, className: string, initialSearch: string) {
  return filterForSearchResult(searchClassModal, className.toLowerCase(), classIdFromPrefixAndName(modelPrefix, className), initialSearch);
}

export function filterForNewClass(className: string) {

  return createStory({

    title: `Search for ${className.toLowerCase()}`,
    content: 'Diipadaa',
    popover: { element: searchClassModalTextSearchElement, position: 'bottom-right' },
    focus: { element: searchClassModalTextSearchElement },
    nextCondition: createExpectedStateNextCondition(inputHasExactValue(searchClassModalTextSearchElement, className)),
    initialize: initialInputValue(searchClassModalTextSearchElement, className),
    reversible: true
  });
}

export function selectClass(modelPrefix: string, className: string) {
  return selectSearchResult(searchClassModal, className.toLowerCase(), classIdFromPrefixAndName(modelPrefix, className), true);
}

const selectAddNewClassSearchResultElement = first(child(searchClassResultsElement, '.search-result.add-new'));
export const selectAddNewClassSearchResult = createStory({
  title: 'Select new creation',
  content: 'Diipadaa',
  scroll: createScrollWithElement(searchClassResultsElement, selectAddNewClassSearchResultElement),
  popover: { element: selectAddNewClassSearchResultElement, position: 'bottom-right' },
  focus: { element: selectAddNewClassSearchResultElement },
  nextCondition: createClickNextCondition(selectAddNewClassSearchResultElement)
});

export const focusSelectedClass = focusSearchSelection(searchClassModal, 'Class is here', 'Diipadaa');

export const confirmClassSelection = confirm(searchClassModal, false);
