import { confirm } from '../../modal/modalHelp.po';
import {
  filterForSearchResult, selectSearchResult, focusSearchSelection,
  textSearchElement
} from '../../modal/searchModalHelp.po';
import { modal, child, first } from '../../../selectors';
import {
  createStory, createExpectedStateNextCondition,
  createClickNextCondition
} from '../../../contract';
import { initialInputValue, inputHasExactValue } from '../../../utils';

const searchClassModal = child(modal, '.search-class');
const searchClassModalTextSearchElement = textSearchElement(searchClassModal);

function resourceIdFromPrefixAndName(modelPrefix: string, name: string) {
  return `http://iow.csc.fi/ns/${modelPrefix}#${name}`;
}

export function filterForClass(modelPrefix: string, className: string, initialSearch: string) {
  return filterForSearchResult(searchClassModal, className.toLowerCase(), resourceIdFromPrefixAndName(modelPrefix, className), initialSearch);
}

export function filterForNewClass(className: string) {

  return createStory({

    title: `Search for ${className.toLowerCase()}`,
    content: 'Diipadaa',
    popover: {
      element: searchClassModalTextSearchElement,
      position: 'bottom-right'
    },
    focus: { element: searchClassModalTextSearchElement },
    nextCondition: createExpectedStateNextCondition(inputHasExactValue(searchClassModalTextSearchElement, className)),
    initialize: initialInputValue(searchClassModalTextSearchElement, className)
  });
}

export function selectClass(modelPrefix: string, className: string) {
  return selectSearchResult(searchClassModal, className.toLowerCase(), resourceIdFromPrefixAndName(modelPrefix, className), true);
}

const addNewClassSearchResultElement = first(child(searchClassModal, '.search-result.add-new'));
export const addNewClassSearchResult = createStory({
  title: 'Select new creation',
  content: 'Diipadaa',
  popover: {
    element: addNewClassSearchResultElement,
    position: 'bottom-right'
  },
  focus: { element: addNewClassSearchResultElement },
  nextCondition: createClickNextCondition(addNewClassSearchResultElement)
});

export const focusSelectedClass = focusSearchSelection(searchClassModal, 'Class is here', 'Diipadaa');

export const confirmClassSelection = confirm(searchClassModal, false);
