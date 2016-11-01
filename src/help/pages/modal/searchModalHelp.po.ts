import { searchResult, child, nth, first } from '../../selectors';
import {
  createStory, createModifyingClickNextCondition,
  createClickNextCondition, createExplicitNextCondition, createExpectedStateNextCondition, createScrollWithElement
} from '../../contract';
import { initialInputValue, elementExists, inputHasExactValue, expectAll } from '../../utils';

export const textSearchElement = (modalParent: () => JQuery) => child(modalParent, 'text-filter input');
export const searchSelectionElement = (modalParent: () => JQuery) => child(modalParent, '.search-selection');
export const searchResultsElement = (modalParent: () => JQuery) => child(modalParent, '.search-results');

export function filterForSearchResult(modalParent: () => JQuery, label: string, expectedResultId: string, initialSearch: string) {

  const filterForSearchResultTextSearchElement = textSearchElement(modalParent);

  return createStory({

    title: `Search for ${label}`,
    content: 'Diipadaa',
    popover: { element: filterForSearchResultTextSearchElement, position: 'bottom-right' },
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
    popover: { element: selectResultElement, position: 'left-down' },
    focus: { element: selectResultElement },
    nextCondition: selectionNeedsConfirmation ? createClickNextCondition(selectResultElement)
                                              : createModifyingClickNextCondition(selectResultElement),
    reversible: selectionNeedsConfirmation
  });
}

export function filterForAddNewResult(modalParent: () => JQuery, searchFor: string, expectSearch: string) {

  const filterForAddNewElement = textSearchElement(modalParent);
  const addNewResultsElements = first(child(modalParent, '.search-result.add-new'));

  return createStory({

    title: `Search for ${searchFor.toLowerCase()}`,
    content: 'Diipadaa',
    popover: { element: filterForAddNewElement, position: 'bottom-right' },
    focus: { element: filterForAddNewElement },
    nextCondition: createExpectedStateNextCondition(
      expectAll(
        inputHasExactValue(filterForAddNewElement, expectSearch.toLowerCase()),
        elementExists(addNewResultsElements)
      )
    ),
    initialize: initialInputValue(filterForAddNewElement, expectSearch.toLowerCase()),
    reversible: true
  });
}

export function selectAddNewResult(modalParent: () => JQuery, addNewIndex: number, title: string) {

  const selectAddNewSearchResultsElement = searchResultsElement(modalParent);
  const selectAddNewElement = nth(child(selectAddNewSearchResultsElement, '.search-result.add-new'), addNewIndex);

  return createStory({
    title: title,
    content: 'Diipadaa',
    scroll: createScrollWithElement(selectAddNewSearchResultsElement, selectAddNewElement),
    popover: { element: selectAddNewElement, position: 'bottom-right' },
    focus: { element: selectAddNewElement },
    nextCondition: createClickNextCondition(selectAddNewElement)
  });
}

export function focusSearchSelection(modalParent: () => JQuery, label: string, content?: string) {

  const focusSearchResultElement = searchSelectionElement(modalParent);

  return createStory({
    title: label,
    content: content,
    popover: { element: focusSearchResultElement, position: 'left-down' },
    focus: { element: focusSearchResultElement },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition()
  });
}
