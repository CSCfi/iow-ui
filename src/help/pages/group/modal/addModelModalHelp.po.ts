import { createStory, createNavigatingClickNextCondition, createExpectedStateNextCondition } from '../../../contract';
import {
  input, modal, editableByTitle, editableFocus, editableMultipleByTitle, multiInput,
  child
} from '../../../selectors';
import { editableMargin, editableMultipleMargin, initialInputValue, validInput } from '../../../utils';
import { KnownModelType } from '../../../../entities/type';
import { upperCaseFirst } from 'change-case';


export function enterModelPrefix(type: KnownModelType) {

  const enterModelPrefixElement = editableByTitle(modal, 'Prefix');
  const enterModelPrefixInputElement = input(enterModelPrefixElement);

  return createStory({

    title: 'Prefix',
    content: 'Prefix info',
    popover: {
      element: enterModelPrefixInputElement,
      position: 'left-down'
    },
    focus: {
      element: editableFocus(enterModelPrefixElement),
      margin: editableMargin
    },
    nextCondition: createExpectedStateNextCondition(validInput(enterModelPrefixInputElement)),
    reversible: true,
    initialize: initialInputValue(enterModelPrefixInputElement, type === 'library' ? 'testi' : 'plv')
  });
}

export function enterModelLabel(type: KnownModelType) {

  const title = upperCaseFirst(type) + ' label';
  const enterModelLabelElement = editableByTitle(modal, title);
  const enterModelLabelInputElement = input(enterModelLabelElement);

  return createStory({

    title: title,
    content: title + ' info',
    popover: {
      element: enterModelLabelInputElement,
      position: 'left-down'
    },
    focus: {
      element: editableFocus(enterModelLabelElement),
      margin: editableMargin
    },
    nextCondition: createExpectedStateNextCondition(validInput(enterModelLabelInputElement)),
    reversible: true,
    initialize: initialInputValue(enterModelLabelInputElement, type === 'library' ? 'Testikirjasto' : 'Palveluprofiili')
  });
}

const enterModelLanguageElement = editableMultipleByTitle(modal, 'Model languages');
const enterModelLanguageInputElement = multiInput(enterModelLanguageElement);
export const enterModelLanguage = createStory({

  title: 'Model languages',
  content: 'Diipadaa',
  popover: {
    element: enterModelLanguageInputElement,
    position: 'left-down'
  },
  focus: {
    element: editableFocus(enterModelLanguageElement),
    margin: editableMultipleMargin
  },
  reversible: true,
  nextCondition: createExpectedStateNextCondition(validInput(enterModelLanguageInputElement))
});

const createModelElement = child(modal, 'button.create');
export const createModel = createStory({

  title: 'Create new',
  content: 'Create new',
  popover: {
    element: createModelElement,
    position: 'top-right'
  },
  focus: { element: createModelElement },
  nextCondition: createNavigatingClickNextCondition(createModelElement)
});
