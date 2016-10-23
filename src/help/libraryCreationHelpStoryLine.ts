import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  StoryLine, createStory, createNotification, createModifyingClickNextCondition,
  createClickNextConfition, createValidInputNextCondition, createElementExistsNextCondition,
  createNavigatingClickNextCondition
} from './contract';
import {
  findEditableByTitle, modal, input, editableFocus, findEditableMultipleByTitle, multiInput,
  modelView, child, searchResult
} from './selectors';

const editableMargin = { left: 20, right: 20 };

const browsePanel = () => angular.element('#browse-panel');
const selectGroupElement = child(browsePanel, '.selectable-panel__list');
const selectGroup = createStory({

  popoverTo: selectGroupElement,
  focusTo: { element: browsePanel },
  popoverPosition: 'left',
  title: 'Select group',
  content: 'Diipadaa',
  nextCondition: createNavigatingClickNextCondition(selectGroupElement)
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
  popoverPosition: 'top',
  title: 'Create new',
  content: 'Create new',
  nextCondition: createNavigatingClickNextCondition(createLibraryElement)
});

const saveUnsavedLibraryElement = child(modelView, 'button.save');
const saveUnsavedLibrary = createStory({

  popoverTo: saveUnsavedLibraryElement,
  focusTo: { element: saveUnsavedLibraryElement },
  popoverPosition: 'left',
  title: 'Save changes',
  content: 'Diipadaa',
  nextCondition: createNavigatingClickNextCondition(saveUnsavedLibraryElement),
  cannotMoveBack: true
});

const openLibraryDetailsElement = child(modelView, '.model-header');
const openLibraryDetails = createStory({

  popoverTo: openLibraryDetailsElement,
  focusTo: { element: openLibraryDetailsElement },
  popoverPosition: 'bottom',
  title: 'Open library details',
  content: 'Diipadaa',
  nextCondition: createClickNextConfition(openLibraryDetailsElement),
  cannotMoveBack: true
});

const modifyLibraryElement = child(modelView, 'button.edit');
const modifyLibrary = createStory({

  popoverTo: modifyLibraryElement,
  focusTo: { element: modifyLibraryElement },
  popoverPosition: 'left',
  title: 'Modify library',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(modifyLibraryElement),
  cannotMoveBack: true
});

const requireNamespaceElement = child(modelView, 'imported-namespaces-view button');
const requireNamespace = createStory({

  popoverTo: requireNamespaceElement,
  focusTo: { element: requireNamespaceElement },
  popoverPosition: 'left',
  title: 'Add reference to namespace',
  content: 'Diipadaa',
  nextCondition: createClickNextConfition(requireNamespaceElement),
  cannotMoveBack: true
});

const filterForJhsElement = child(modal, 'text-filter input');
const filterForJhs = createStory({

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
const selectJhsResult = createStory({

  popoverTo: selectJhsResultElement,
  focusTo: { element: selectJhsResultElement },
  popoverPosition: 'left',
  title: 'Select jhs',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(selectJhsResultElement)
});

const saveLibraryChangesElement = child(modelView, 'button.save');
const saveLibraryChanges = createStory({

  popoverTo: saveLibraryChangesElement,
  focusTo: { element: saveLibraryChangesElement },
  popoverPosition: 'left',
  title: 'Save changes',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(saveLibraryChangesElement),
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
      saveUnsavedLibrary,
      openLibraryDetails,
      modifyLibrary,
      requireNamespace,
      filterForJhs,
      selectJhsResult,
      saveLibraryChanges,
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
