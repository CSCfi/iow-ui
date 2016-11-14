import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  createHelpWithDefaultHandler, createNotification, InteractiveHelp, Story, Notification, StoryLine
} from './contract';
import { Group } from '../entities/group';
import { KnownModelType } from '../entities/type';
import * as GroupPage from './pages/group/groupPageHelp.po';
import * as AddModelModal from './pages/group/modal/addModelModalHelp.po';
import * as NewModelPage from './pages/model/newModelPageHelp.po';
import * as ModelPage from './pages/model/modelPageHelp.po';
import * as ModelView from './pages/model/modelViewHelp.po';
import {
  addNamespaceItems, specializeClassItems, createNewClassItems, addAssociationItems,
  assignClassItems
} from './modelPageHelp';
import { exampleProfile, exampleImportedLibrary } from './entities';
import { modelIdFromPrefix } from './utils';
import gettextCatalog = angular.gettext.gettextCatalog;

export function createNewLibraryItems(gettextCatalog: gettextCatalog): Story[] {

  return [
    GroupPage.startModelCreation('library'),
    AddModelModal.enterModelPrefix('library'),
    AddModelModal.enterModelLanguage,
    AddModelModal.enterModelLabel('library', gettextCatalog),
    AddModelModal.createModel,
    NewModelPage.saveUnsavedModel,
    ModelPage.openModelDetails('library'),
    ModelView.modifyModel('library'),
    ...addNamespaceItems(gettextCatalog),
    ModelView.saveModelChanges,
    ...assignClassItems(gettextCatalog),
    ...createNewClassItems(gettextCatalog),
    ...addAssociationItems(exampleImportedLibrary.namespaceId, gettextCatalog)
  ];
}

export function createNewProfileItems(gettextCatalog: gettextCatalog): Story[] {

  return [
    GroupPage.startModelCreation('profile'),
    AddModelModal.enterModelPrefix('profile'),
    AddModelModal.enterModelLanguage,
    AddModelModal.enterModelLabel('profile', gettextCatalog),
    AddModelModal.createModel,
    NewModelPage.saveUnsavedModel,
    ModelPage.openModelDetails('profile'),
    ModelView.modifyModel('profile'),
    ...addNamespaceItems(gettextCatalog),
    ModelView.saveModelChanges,
    ...specializeClassItems(gettextCatalog),
    ...createNewClassItems(gettextCatalog),
    ...addAssociationItems(modelIdFromPrefix(exampleProfile.prefix), gettextCatalog)
  ];
}

export function finishedCreateNewModelNotification(type: KnownModelType): Notification {
  return createNotification({
    title: `Congratulations for completing ${type} creation!`,
    content: `Congratulations for completing ${type} creation! description`
  });
}

function createNewModel(type: KnownModelType, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: `Guide through creating new ${type}`,
    description: `Guide through creating new ${type} description`,
    items: () => [
      ...(type === 'profile' ? createNewProfileItems(gettextCatalog) : createNewLibraryItems(gettextCatalog)),
      finishedCreateNewModelNotification(type)
    ]
  };
}

export class GroupPageHelpService {

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService, private $location: ILocationService, private gettextCatalog: gettextCatalog) {
  }

  private returnToGroupPage(group: Group) {
    this.$uibModalStack.dismissAll();
    this.$location.url(group.iowUrl());
  }

  getHelps(group: Group): InteractiveHelp[] {
    return [
      createHelpWithDefaultHandler(createNewModel('library', this.gettextCatalog), () => this.returnToGroupPage(group)),
      createHelpWithDefaultHandler(createNewModel('profile', this.gettextCatalog), () => this.returnToGroupPage(group))
    ];
  }
}
