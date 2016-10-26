import { createModifyingClickNextCondition, createStory, createElementExistsNextCondition } from '../../../contract';
import { modal, searchResult, child } from '../../../selectors';

const textSearchElement = child(modal, 'text-filter input');

function modelIdFromPrefix(modelPrefix: string) {
  return `http://iow.csc.fi/ns/${modelPrefix}`;
}

export function filterForModel(modelPrefix: string, initialSearch: string) {

  return createStory({

    title: `Search for ${modelPrefix}`,
    content: 'Diipadaa',
    popover: {
      element: textSearchElement,
      position: 'bottom'
    },
    focus: { element: textSearchElement },
    nextCondition: createElementExistsNextCondition(searchResult(modal, modelIdFromPrefix(modelPrefix))),
    initialInputValue: {
      value: initialSearch,
      element: textSearchElement
    }
  });
}

export function selectResult(modelPrefix: string) {

  const selectResultElement = searchResult(modal, modelIdFromPrefix(modelPrefix));

  return createStory({

    title: `Select ${modelPrefix}`,
    content: 'Diipadaa',
    popover: {
      element: selectResultElement,
      position: 'left'
    },
    focus: { element: selectResultElement },
    nextCondition: createModifyingClickNextCondition(selectResultElement)
  });
}
