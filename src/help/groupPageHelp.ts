import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { StoryLine, createNotification, HelpEventHandler, augmentHandlers } from './contract';
import { startLibraryCreation } from './pages/group/groupPageHelp.po';
import { enterLibraryPrefix, enterLibraryLanguage, enterLibraryLabel, createLibrary } from './pages/group/modal/addModelModalHelp.po';
import { saveUnsavedLibrary } from './pages/model/newModelPageHelp.po';
import { openLibraryDetails } from './pages/model/modelPageHelp.po';
import { modifyLibrary, requireNamespace, saveLibraryChanges } from './pages/model/modelViewHelp.po';
import { filterForJhs, selectJhsResult } from './pages/model/modal/addEditNamepaceModalHelp.po';
import { Group } from '../entities/group';

const finishedNotification = createNotification({
  title: 'Congratulations for completing library creation!',
  content: 'Diipadaa',
  cannotMoveBack: true
});

export const createNewLibrary: StoryLine = {
  title: 'Guide through creating new library',
  description: 'Diipadaa',
  items: [
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

export class GroupPageHelpService {

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService, private $location: ILocationService) {
  }

  private returnToGroupPageHandler(group: Group): HelpEventHandler {
    return {
      onComplete: () => this.returnToGroupPage(group),
      onCancel: () => this.returnToGroupPage(group)
    };
  };

  private returnToGroupPage(group: Group) {
    this.$uibModalStack.dismissAll();
    this.$location.url(group.iowUrl());
  }

  getStoryLines(group: Group): StoryLine[] {
    return [augmentHandlers(createNewLibrary, this.returnToGroupPageHandler(group))];
  }
}
