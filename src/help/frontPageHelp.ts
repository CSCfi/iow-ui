import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { StoryLine, createNotification, HelpEventHandler, augmentHandlers } from './contract';
import { selectGroup } from './pages/frontPageHelp.po';
import { startLibraryCreation } from './pages/group/groupPageHelp.po';
import { enterLibraryPrefix, enterLibraryLanguage, enterLibraryLabel, createLibrary } from './pages/group/modal/addModelModalHelp.po';
import { saveUnsavedLibrary } from './pages/model/newModelPageHelp.po';
import { openLibraryDetails } from './pages/model/modelPageHelp.po';
import { modifyLibrary, requireNamespace, saveLibraryChanges } from './pages/model/modelViewHelp.po';
import { filterForJhs, selectJhsResult } from './pages/model/modal/addEditNamepaceModalHelp.po';

const finishedNotification = createNotification({
  title: 'Congratulations for completing library creation!',
  content: 'Diipadaa',
  cannotMoveBack: true
});

export const frontPageHelp: StoryLine = {
  title: 'Guide through creating new library',
  description: 'Diipadaa',
  items: [
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
  ]
};

export class FrontPageHelpService {

  private returnToFrontPageHandler: HelpEventHandler = {
    onComplete: this.returnToFrontPage.bind(this),
    onCancel: this.returnToFrontPage.bind(this)
  };

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService, private $location: ILocationService) {
  }

  private returnToFrontPage() {
    this.$uibModalStack.dismissAll();
    this.$location.url('/');
  }

  getStoryLines(): StoryLine[] {
    return [augmentHandlers(frontPageHelp, this.returnToFrontPageHandler)];
  }
}
