import { createStory, createValidInputNextCondition, createNavigatingClickNextCondition } from '../../../contract';
import {
  input, modal, editableByTitle, editableFocus, editableMultipleByTitle, multiInput,
  child
} from '../../../selectors';
import { editableMargin, editableMultipleMargin } from '../../../constants';
import { KnownModelType } from '../../../../entities/type';
import { upperCaseFirst } from 'change-case';


function enterModelPrefix(type: KnownModelType) {

  const enterModelPrefixElement = editableByTitle(modal, 'Prefix');
  const enterModelPrefixInputElement = input(enterModelPrefixElement);

  return createStory({

    popoverTo: enterModelPrefixInputElement,
    focusTo: {
      element: editableFocus(enterModelPrefixElement),
      margin: editableMargin
    },
    popoverPosition: 'left',
    title: 'Prefix',
    content: 'Prefix info',
    nextCondition: createValidInputNextCondition(enterModelPrefixInputElement),
    initialInputValue: {
      value: type === 'library' ? 'testi' : 'plv',
      element: enterModelPrefixInputElement
    }
  });
}

export const enterLibraryPrefix = enterModelPrefix('library');
export const enterProfilePrefix = enterModelPrefix('profile');

function enterModelLabel(type: KnownModelType) {

  const title = upperCaseFirst(type) + ' label';
  const enterModelLabelElement = editableByTitle(modal, title);
  const enterModelLabelInputElement = input(enterModelLabelElement);

  return createStory({

    popoverTo: enterModelLabelInputElement,
    focusTo: {
      element: editableFocus(enterModelLabelElement),
      margin: editableMargin
    },
    popoverPosition: 'left',
    title: title,
    content: title + ' info',
    nextCondition: createValidInputNextCondition(enterModelLabelInputElement),
    initialInputValue: {
      value: type === 'library' ? 'Testikirjasto' : 'Palveluprofiili',
      element: enterModelLabelInputElement
    }
  });
}

export const enterLibraryLabel = enterModelLabel('library');
export const enterProfileLabel = enterModelLabel('profile');

const enterModelLanguageElement = editableMultipleByTitle(modal, 'Model languages');
const enterModelLanguageInputElement = multiInput(enterModelLanguageElement);
export const enterModelLanguage = createStory({

  popoverTo: enterModelLanguageInputElement,
  focusTo: {
    element: editableFocus(enterModelLanguageElement),
    margin: editableMultipleMargin
  },
  popoverPosition: 'left',
  title: 'Model languages',
  content: 'Diipadaa',
  nextCondition: createValidInputNextCondition(enterModelLanguageInputElement)
});

const createModelElement = child(modal, 'button.create');
export const createModel = createStory({

  popoverTo: createModelElement,
  focusTo: { element: createModelElement },
  popoverPosition: 'top',
  title: 'Create new',
  content: 'Create new',
  nextCondition: createNavigatingClickNextCondition(createModelElement)
});
