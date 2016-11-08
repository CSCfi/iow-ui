import { searchResult, child, nth, first } from '../../selectors';
import {
  createStory, createModifyingClickNextCondition,
  createClickNextCondition, createExplicitNextCondition, createExpectedStateNextCondition, createScrollWithElement
} from '../../contract';
import { initialInputValue, elementExists, inputHasExactValue, expectAll } from '../../utils';
import gettextCatalog = angular.gettext.gettextCatalog;

export const textSearchElement = (modalParent: () => JQuery) => child(modalParent, 'text-filter input');
export const searchSelectionElement = (modalParent: () => JQuery) => child(modalParent, '.search-selection');
export const searchResultsElement = (modalParent: () => JQuery) => child(modalParent, '.search-results');


export function filterForSearchResult(modalParent: () => JQuery, label: string, expectedResultId: string, gettextCatalog: gettextCatalog) {

  const filterForSearchResultTextSearchElement = textSearchElement(modalParent);

  function formatInitialSearch() {
    const localizedLabel = gettextCatalog.getString(label);
    return localizedLabel.toLowerCase().substring(0, Math.min(4, localizedLabel.length));
  }

  return createStory({

    title: `Search for ${label.toLowerCase()}`,
    content: `Search for ${label.toLowerCase()} info`,
    popover: { element: filterForSearchResultTextSearchElement, position: 'bottom-right' },
    focus: { element: filterForSearchResultTextSearchElement },
    nextCondition: createExpectedStateNextCondition(elementExists(searchResult(modalParent, expectedResultId))),
    initialize: initialInputValue(filterForSearchResultTextSearchElement, formatInitialSearch()),
    reversible: true
  });
}

export function selectSearchResult(modalParent: () => JQuery, label: string, resultId: string, selectionNeedsConfirmation: boolean) {

  const selectResultElement = searchResult(modalParent, resultId);

  return createStory({

    title: `Select ${label.toLowerCase()}`,
    content: `Select ${label.toLowerCase()} info`,
    scroll: createScrollWithElement(searchResultsElement(modalParent), selectResultElement),
    popover: { element: selectResultElement, position: 'left-down' },
    focus: { element: selectResultElement },
    nextCondition: selectionNeedsConfirmation ? createClickNextCondition(selectResultElement)
                                              : createModifyingClickNextCondition(selectResultElement),
    reversible: selectionNeedsConfirmation
  });
}

export function filterForAddNewResult(modalParent: () => JQuery, searchFor: string, gettextCatalog: gettextCatalog) {

  const filterForAddNewElement = textSearchElement(modalParent);
  const addNewResultsElements = first(child(modalParent, '.search-result.add-new'));
  const localizedSearch = gettextCatalog.getString(searchFor).toLowerCase();

  return createStory({

    title: `Search for ${searchFor.toLowerCase()}`,
    content: `Search for ${searchFor.toLowerCase()} info`,
    popover: { element: filterForAddNewElement, position: 'bottom-right' },
    focus: { element: filterForAddNewElement },
    nextCondition: createExpectedStateNextCondition(
      expectAll(
        inputHasExactValue(filterForAddNewElement, localizedSearch),
        elementExists(addNewResultsElements)
      )
    ),
    initialize: initialInputValue(filterForAddNewElement, localizedSearch),
    reversible: true
  });
}

export function selectAddNewResult(modalParent: () => JQuery, addNewIndex: number, title: string) {

  const selectAddNewSearchResultsElement = searchResultsElement(modalParent);
  const selectAddNewElement = nth(child(selectAddNewSearchResultsElement, '.search-result.add-new'), addNewIndex);

  return createStory({
    title: title,
    content: title + ' info',
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
