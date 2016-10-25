import { createModifyingClickNextCondition, createStory, createElementExistsNextCondition } from '../../../contract';
import { modal, searchResult, child } from '../../../selectors';

const filterForJhsElement = child(modal, 'text-filter input');
export const filterForJhs = createStory({

  title: 'Search for jhs',
  content: 'Diipadaa',
  popover: {
    element: filterForJhsElement,
    position: 'bottom'
  },
  focus: { element: filterForJhsElement },
  nextCondition: createElementExistsNextCondition(searchResult(modal, 'http://iow.csc.fi/ns/jhs')),
  initialInputValue: {
    value: 'julkis',
    element: filterForJhsElement
  }
});

const selectJhsResultElement = searchResult(modal, 'http://iow.csc.fi/ns/jhs');
export const selectJhsResult = createStory({

  title: 'Select jhs',
  content: 'Diipadaa',
  popover: {
    element: selectJhsResultElement,
    position: 'left'
  },
  focus: { element: selectJhsResultElement },
  nextCondition: createModifyingClickNextCondition(selectJhsResultElement)
});
