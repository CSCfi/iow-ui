import { createStory, createValidInputNextCondition, createNavigatingClickNextCondition } from '../../../contract';
import {
  input, modal, editableByTitle, editableFocus, editableMultipleByTitle, multiInput,
  child
} from '../../../selectors';
import { editableMargin, editableMultipleMargin } from '../../../constants';

const enterLibraryPrefixElement = editableByTitle(modal, 'Prefix');
const enterLibraryPrefixInputElement = input(enterLibraryPrefixElement);
export const enterLibraryPrefix = createStory({

  popoverTo: enterLibraryPrefixInputElement,
  focusTo: {
    element: editableFocus(enterLibraryPrefixElement),
    margin: editableMargin
  },
  popoverPosition: 'left',
  title: 'Prefix',
  content: 'Prefix info',
  nextCondition: createValidInputNextCondition(enterLibraryPrefixInputElement),
  cannotMoveBack: true,
  initialInputValue: {
    value: 'testi',
    element: enterLibraryPrefixInputElement
  }
});

const enterLibraryLabelElement = editableByTitle(modal, 'Library label');
const enterLibraryLabelInputElement = input(enterLibraryLabelElement);
export const enterLibraryLabel = createStory({

  popoverTo: enterLibraryLabelInputElement,
  focusTo: {
    element: editableFocus(enterLibraryLabelElement),
    margin: editableMargin
  },
  popoverPosition: 'left',
  title: 'Library label',
  content: 'Library label info',
  nextCondition: createValidInputNextCondition(enterLibraryLabelInputElement),
  initialInputValue: {
    value: 'Testikirjasto',
    element: enterLibraryLabelInputElement
  }
});

const enterLibraryLanguageElement = editableMultipleByTitle(modal, 'Model languages');
const enterLibraryLanguageInputElement = multiInput(enterLibraryLanguageElement);
export const enterLibraryLanguage = createStory({

  popoverTo: enterLibraryLanguageInputElement,
  focusTo: {
    element: editableFocus(enterLibraryLanguageElement),
    margin: editableMultipleMargin
  },
  popoverPosition: 'left',
  title: 'Model languages',
  content: 'Diipadaa',
  nextCondition: createValidInputNextCondition(enterLibraryLanguageInputElement)
});

const createLibraryElement = child(modal, 'button.create');
export const createLibrary = createStory({

  popoverTo: createLibraryElement,
  focusTo: { element: createLibraryElement },
  popoverPosition: 'top',
  title: 'Create new',
  content: 'Create new',
  nextCondition: createNavigatingClickNextCondition(createLibraryElement)
});
