import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  StoryLine, createHelpWithDefaultHandler, createNotification, InteractiveHelp
} from './contract';
import { startLibraryCreation, startProfileCreation } from './pages/group/groupPageHelp.po';
import {
  enterModelLanguage, createModel,
  enterProfileLabel, enterLibraryLabel, enterProfilePrefix, enterLibraryPrefix
} from './pages/group/modal/addModelModalHelp.po';
import { saveUnsavedModel } from './pages/model/newModelPageHelp.po';
import { openModelDetails } from './pages/model/modelPageHelp.po';
import {
  requireNamespace, saveModelChanges, modifyLibrary,
  modifyProfile
} from './pages/model/modelViewHelp.po';
import { filterForJhs, selectJhsResult } from './pages/model/modal/addEditNamepaceModalHelp.po';
import { Group } from '../entities/group';

const finishedLibraryNotification = createNotification({
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
    enterModelLanguage,
    enterLibraryLabel,
    createModel,
    saveUnsavedModel,
    openModelDetails,
    modifyLibrary,
    requireNamespace,
    filterForJhs,
    selectJhsResult,
    saveModelChanges,
    finishedLibraryNotification
  ]
};

const finishedProfileNotification = createNotification({
  title: 'Congratulations for completing profile creation!',
  content: 'Diipadaa',
  cannotMoveBack: true
});

export const createNewProfile: StoryLine = {
  title: 'Guide through creating new profile',
  description: 'Diipadaa',
  items: [
    startProfileCreation,
    enterProfilePrefix,
    enterModelLanguage,
    enterProfileLabel,
    createModel,
    saveUnsavedModel,
    openModelDetails,
    modifyProfile,
    requireNamespace,
    filterForJhs,
    selectJhsResult,
    saveModelChanges,
    finishedProfileNotification
  ]
};

export class GroupPageHelpService {

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService, private $location: ILocationService) {
  }

  private returnToGroupPage(group: Group) {
    this.$uibModalStack.dismissAll();
    this.$location.url(group.iowUrl());
  }

  getHelps(group: Group): InteractiveHelp[] {
    return [
      createHelpWithDefaultHandler(createNewLibrary, () => this.returnToGroupPage(group)),
      createHelpWithDefaultHandler(createNewProfile, () => this.returnToGroupPage(group))
    ];
  }
}
