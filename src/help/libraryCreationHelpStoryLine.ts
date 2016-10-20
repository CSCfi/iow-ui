import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  StoryLine, createStory, createNotification, createModifyingClickNextCondition,
  createClickNextConfition, createValidInputNextCondition
} from './contract';

const editableMargin = { left: 15, right: 15, top: 5, bottom: -10 };

const selectGroupElement = () => angular.element('#browse-panel .selectable-panel__list');
const selectGroup = createStory({

  popoverTo: selectGroupElement,
  focusTo: () => ({
    element: selectGroupElement()
  }),
  popoverPosition: 'left',
  title: 'Select group',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(selectGroupElement)
});

const startLibraryCreationElement = () => angular.element('#add-library-button');
const startLibraryCreation = createStory({

  popoverTo: startLibraryCreationElement,
  focusTo: () => ({
    element: startLibraryCreationElement()
  }),
  popoverPosition: 'left',
  title: 'Add library',
  content: 'Diipadaa',
  nextCondition: createClickNextConfition(startLibraryCreationElement),
  cannotMoveBack: true
});

const enterLibraryPrefixElement = () => angular.element('.modal-dialog [data-title="Prefix"]');
const enterLibraryPrefix = createStory({

  popoverTo: () => enterLibraryPrefixElement().find('input'),
  focusTo: () => ({
    element: enterLibraryPrefixElement(),
    margin: editableMargin
  }),
  popoverPosition: 'left',
  title: 'Prefix',
  content: 'Prefix info',
  nextCondition: createValidInputNextCondition(enterLibraryPrefixElement),
  cannotMoveBack: true,
  initialInputValue: 'testi'
});

const enterLibraryLabelElement = () => angular.element('.modal-dialog [data-title="Library label"]');
const enterLibraryLabel = createStory({

  popoverTo: () => enterLibraryLabelElement().find('input'),
  focusTo: () => ({
    element: enterLibraryLabelElement(),
    margin: editableMargin
  }),
  popoverPosition: 'left',
  title: 'Library label',
  content: 'Library label info',
  nextCondition: createValidInputNextCondition(() => enterLibraryLabelElement().find('input')),
  initialInputValue: 'Testikirjasto'
});

const enterLibraryLanguageElement = () => angular.element('editable-multiple-language-select editable-multiple');
const enterLibraryLanguage = createStory({

  popoverTo: enterLibraryLanguageElement,
  focusTo: () => ({
    element: enterLibraryLanguageElement().find('div.editable-wrap'),
    margin: Object.assign({}, editableMargin, { bottom: 10 })
  }),
  popoverPosition: 'left',
  title: 'Model languages',
  content: 'Diipadaa',
  nextCondition: createValidInputNextCondition(enterLibraryLanguageElement)
});

const createLibraryElement = () => angular.element('.modal-dialog button.create');
const createLibrary = createStory({

  popoverTo: createLibraryElement,
  focusTo: () => ({
    element: createLibraryElement()
  }),
  popoverPosition: 'left',
  title: 'Create new',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(createLibraryElement)
});

const saveLibraryElement = () => angular.element('button.save');
const saveLibrary = createStory({

  popoverTo: saveLibraryElement,
  focusTo: () => ({
    element: saveLibraryElement()
  }),
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
