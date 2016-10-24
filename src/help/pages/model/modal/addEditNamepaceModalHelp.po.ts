import { createModifyingClickNextCondition, createStory, createElementExistsNextCondition } from '../../../contract';
import { modal, searchResult, child } from '../../../selectors';

const filterForJhsElement = child(modal, 'text-filter input');
export const filterForJhs = createStory({

  popoverTo: filterForJhsElement,
  focusTo: { element: filterForJhsElement },
  popoverPosition: 'bottom',
  title: 'Search for jhs',
  content: 'Diipadaa',
  nextCondition: createElementExistsNextCondition(searchResult(modal, 'http://iow.csc.fi/ns/jhs')),
  initialInputValue: {
    value: 'julkis',
    element: filterForJhsElement
  },
  cannotMoveBack: true
});

const selectJhsResultElement = searchResult(modal, 'http://iow.csc.fi/ns/jhs');
export const selectJhsResult = createStory({

  popoverTo: selectJhsResultElement,
  focusTo: { element: selectJhsResultElement },
  popoverPosition: 'left',
  title: 'Select jhs',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(selectJhsResultElement)
});
