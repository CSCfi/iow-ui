import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  StoryLine, createStory, createNotification, createModifyingClickNextCondition,
  createClickNextConfition, createValidInputNextCondition
} from './contract';

const modal = () => angular.element('.modal-dialog');
const modelView = () => angular.element('model-view');

function child(selector: string, parent: () => JQuery) {
  return () => parent().find(selector);
}

function input(parent: () => JQuery) {
  return () => parent().find('input');
}

function multiInput(parent: () => JQuery) {
  return () => parent().find('.multi-input');
}

function findEditableByTitle(title: string, parent: () => JQuery) {
  return () => parent().find(`editable[data-title="${title}"]`);
}

function findEditableMultipleByTitle(title: string, parent: () => JQuery) {
  return () => parent().find(`editable-multiple[data-title="${title}"]`);
}

function editableFocus(editableParent: () => JQuery) {
  return () => editableParent().find('.editable-wrap');
}

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

const enterLibraryPrefixElement = findEditableByTitle('Prefix', modal);
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
  nextCondition: createValidInputNextCondition(enterLibraryPrefixElement),
  cannotMoveBack: true,
  initialInputValue: {
    value: 'testi',
    element: enterLibraryPrefixInputElement
  }
});

const enterLibraryLabelElement = findEditableByTitle('Library label', modal);
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

const enterLibraryLanguageElement = findEditableMultipleByTitle('Model languages', modal);
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
  nextCondition: createValidInputNextCondition(enterLibraryLanguageElement)
});

const createLibraryElement = child('button.create', modal);
const createLibrary = createStory({

  popoverTo: createLibraryElement,
  focusTo: { element: createLibraryElement },
  popoverPosition: 'left',
  title: 'Create new',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(createLibraryElement)
});


const saveLibraryElement = child('button.save', modelView);
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
