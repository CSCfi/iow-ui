import { modal, searchResult, child } from '../../selectors';
import {
  createStory, createModifyingClickNextCondition,
  createClickNextCondition, createExplicitNextCondition, createExpectedStateNextCondition
} from '../../contract';
import { initialInputValue, elementExists } from '../../utils';

export const textSearchElement = child(modal, 'text-filter input');

export function filterForSearchResult(label: string, expectedResultId: string, initialSearch: string) {

  return createStory({

    title: `Search for ${label}`,
    content: 'Diipadaa',
    popover: {
      element: textSearchElement,
      position: 'bottom-right'
    },
    focus: { element: textSearchElement },
    nextCondition: createExpectedStateNextCondition(elementExists(searchResult(modal, expectedResultId))),
    initialize: initialInputValue(textSearchElement, initialSearch)
  });
}

export function selectSearchResult(label: string, resultId: string, selectionNeedsConfirmation: boolean) {

  const selectResultElement = searchResult(modal, resultId);

  return createStory({

    title: `Select ${label}`,
    content: 'Diipadaa',
    popover: {
      element: selectResultElement,
      position: 'left-down'
    },
    focus: { element: selectResultElement },
    nextCondition: selectionNeedsConfirmation ? createClickNextCondition(selectResultElement)
                                              : createModifyingClickNextCondition(selectResultElement)
  });
}

export function focusSearchResult(label: string, content?: string) {

  const focusSearchResultElement = child(modal, '.search-selection');

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
