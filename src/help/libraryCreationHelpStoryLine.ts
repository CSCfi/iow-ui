import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  StoryLine, createStory, createNotification, createModifyingClickNextCondition,
  createClickNextConfition, createValidInputNextCondition
} from './contract';
import {
  findEditableByTitle, modal, input, editableFocus, findEditableMultipleByTitle, multiInput,
  modelView, child
} from './selectors';

const editableMargin = { left: 20, right: 20 };

const selectGroupElement = () => angular.element('#browse-panel .selectable-panel__list');
const selectGroup = createStory({

  popoverTo: selectGroupElement,
  focusTo: { element: selectGroupElement },
  popoverPosition: 'left',
  title: 'Select group',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(selectGroupElement)
});

const startLibraryCreationElement = () => angular.element('#add-library-button');
const startLibraryCreation = createStory({

  popoverTo: startLibraryCreationElement,
  focusTo: { element: startLibraryCreationElement },
  popoverPosition: 'left',
  title: 'Add library',
  content: 'Diipadaa',
  nextCondition: createClickNextConfition(startLibraryCreationElement),
  cannotMoveBack: true
});

const enterLibraryPrefixElement = findEditableByTitle(modal, 'Prefix');
const enterLibraryPrefixInputElement = input(enterLibraryPrefixElement);
const enterLibraryPrefix = createStory({

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

const enterLibraryLabelElement = findEditableByTitle(modal, 'Library label');
const enterLibraryLabelInputElement = input(enterLibraryLabelElement);
const enterLibraryLabel = createStory({

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

const enterLibraryLanguageElement = findEditableMultipleByTitle(modal, 'Model languages');
const enterLibraryLanguageInputElement = multiInput(enterLibraryLanguageElement);
const enterLibraryLanguage = createStory({

  popoverTo: enterLibraryLanguageInputElement,
  focusTo: {
    element: editableFocus(enterLibraryLanguageElement),
    margin: Object.assign({}, editableMargin, { bottom: 15 })
  },
  popoverPosition: 'left',
  title: 'Model languages',
  content: 'Diipadaa',
  nextCondition: createValidInputNextCondition(enterLibraryLanguageInputElement)
});

const createLibraryElement = child(modal, 'button.create');
const createLibrary = createStory({

  popoverTo: createLibraryElement,
  focusTo: { element: createLibraryElement },
  popoverPosition: 'left',
  title: 'Create new',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(createLibraryElement)
});


const saveLibraryElement = child(modelView, 'button.save');
const saveLibrary = createStory({

  popoverTo: saveLibraryElement,
  focusTo: { element: saveLibraryElement },
  popoverPosition: 'left',
  title: 'Save changes',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(saveLibraryElement),
  cannotMoveBack: true
});

const finishedNotification = createNotification({
  title: 'Congratulations for completing library creation!',
  content: 'Diipadaa',
  cannotMoveBack: true
});

export class LibraryCreationStoryLine implements StoryLine {

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService, private $location: ILocationService) {
  }

  get title() {
    return 'Guide through creating new library';
  }

  get description() {
    return 'Diipadaa';
  }

  get items() {
    return [
      selectGroup,
      startLibraryCreation,
      enterLibraryPrefix,
      enterLibraryLanguage,
      enterLibraryLabel,
      createLibrary,
      saveLibrary,
      finishedNotification
    ];
  }

  onCancel() {
    this.$uibModalStack.dismissAll();
    this.$location.url('/');
  }

  onComplete() {
    this.$location.url('/');
  }
}
