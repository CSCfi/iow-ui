import { modal, searchResult, child } from '../../selectors';
import {
  createElementExistsNextCondition, createStory, createModifyingClickNextCondition,
  createClickNextCondition
} from '../../contract';

const textSearchElement = child(modal, 'text-filter input');

export function filterForSearchResult(label: string, expectedResultId: string, initialSearch: string) {

  return createStory({

    title: `Search for ${label}`,
    content: 'Diipadaa',
    popover: {
      element: textSearchElement,
      position: 'bottom-right'
    },
    focus: { element: textSearchElement },
    nextCondition: createElementExistsNextCondition(searchResult(modal, expectedResultId)),
    initialInputValue: {
      value: initialSearch,
      element: textSearchElement
    }
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
