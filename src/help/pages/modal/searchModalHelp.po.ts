import { searchResult, child } from '../../selectors';
import {
  createStory, createModifyingClickNextCondition,
  createClickNextCondition, createExplicitNextCondition, createExpectedStateNextCondition, createScrollWithElement
} from '../../contract';
import { initialInputValue, elementExists } from '../../utils';

export const textSearchElement = (modalParent: () => JQuery) => child(modalParent, 'text-filter input');
export const searchSelectionElement = (modalParent: () => JQuery) => child(modalParent, '.search-selection');
export const searchResultsElement = (modalParent: () => JQuery) => child(modalParent, '.search-results');

export function filterForSearchResult(modalParent: () => JQuery, label: string, expectedResultId: string, initialSearch: string) {

  const filterForSearchResultTextSearchElement = textSearchElement(modalParent);

  return createStory({

    title: `Search for ${label}`,
    content: 'Diipadaa',
    popover: {
      element: filterForSearchResultTextSearchElement,
      position: 'bottom-right'
    },
    focus: { element: filterForSearchResultTextSearchElement },
    nextCondition: createExpectedStateNextCondition(elementExists(searchResult(modalParent, expectedResultId))),
    initialize: initialInputValue(filterForSearchResultTextSearchElement, initialSearch),
    reversible: true
  });
}

export function selectSearchResult(modalParent: () => JQuery, label: string, resultId: string, selectionNeedsConfirmation: boolean) {

  const selectResultElement = searchResult(modalParent, resultId);

  return createStory({

    title: `Select ${label}`,
    content: 'Diipadaa',
    scroll: createScrollWithElement(searchResultsElement(modalParent), selectResultElement),
    popover: {
      element: selectResultElement,
      position: 'left-down'
    },
    focus: { element: selectResultElement },
    nextCondition: selectionNeedsConfirmation ? createClickNextCondition(selectResultElement)
                                              : createModifyingClickNextCondition(selectResultElement),
    reversible: selectionNeedsConfirmation
  });
}

export function focusSearchSelection(modalParent: () => JQuery, label: string, content?: string) {

  const focusSearchResultElement = searchSelectionElement(modalParent);

  return createStory({
    title: label,
    content: content,
    popover: {
      element: focusSearchResultElement,
      position: 'left-down'
    },
    focus: {
      element: focusSearchResultElement,
      denyInteraction: true
    },
    nextCondition: createExplicitNextCondition()
  });
}
