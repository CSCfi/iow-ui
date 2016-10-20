import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { StoryLine, createStory } from './contract';

const editableMargin = { left: 15, right: 15, top: 5, bottom: -10 };

const selectGroup = createStory({

  popoverTo: () => angular.element('#browse-panel .selectable-panel__list'),
  focusTo: () => ({
    element: angular.element('#browse-panel .selectable-panel__list')
  }),
  popoverPosition: 'left',
  title: 'Select group',
  content: 'Diipadaa',
  nextCondition: 'modifying-click'
});

const startLibraryCreation = createStory({

  popoverTo: () => angular.element('#add-library-button'),
  focusTo: () => ({
    element: angular.element('#add-library-button')
  }),
  popoverPosition: 'left',
  title: 'Add library',
  content: 'Diipadaa',
  nextCondition: 'click'
});

const enterLibraryPrefix = createStory({

  popoverTo: () => angular.element('.modal-dialog [data-title="Prefix"] input'),
  focusTo: () => ({
    element: angular.element('.modal-dialog [data-title="Prefix"]'),
    margin: editableMargin
  }),
  popoverPosition: 'left',
  title: 'Prefix',
  content: 'Prefix info',
  nextCondition: 'valid-input',
  cannotMoveBack: true,
  initialInputValue: 'testi'
});

const enterLibraryLabel = createStory({

  popoverTo: () => angular.element('.modal-dialog [data-title="Library label"] input'),
  focusTo: () => ({
    element: angular.element('.modal-dialog [data-title="Library label"]'),
    margin: editableMargin
  }),
  popoverPosition: 'left',
  title: 'Library label',
  content: 'Library label info',
  nextCondition: 'valid-input',
  initialInputValue: 'Testikirjasto'
});

const enterLibraryLanguage = createStory({

  popoverTo: () => angular.element('editable-multiple-language-select editable-multiple'),
  focusTo: () => ({
    element: angular.element('editable-multiple-language-select div.editable-wrap'),
    margin: Object.assign({}, editableMargin, { bottom: 10 })
  }),
  popoverPosition: 'left',
  title: 'Model languages',
  content: 'Diipadaa',
  nextCondition: 'valid-input'
});

const createLibrary = createStory({

  popoverTo: () => angular.element('.modal-dialog button.create'),
  focusTo: () => ({
    element: angular.element('.modal-dialog button.create')
  }),
  popoverPosition: 'left',
  title: 'Create new',
  content: 'Diipadaa',
  nextCondition: 'modifying-click'
});

const saveLibrary = createStory({

  popoverTo: () => angular.element('button.save'),
  focusTo: () => ({
    element: angular.element('button.save')
  }),
  popoverPosition: 'left',
  title: 'Save changes',
  content: 'Diipadaa',
  nextCondition: 'modifying-click',
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
      saveLibrary
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
