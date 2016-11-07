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

export function createNewModelItems(type: KnownModelType, gettextCatalog: gettextCatalog): Story[] {

  const isProfile = type === 'profile';
  const namespaceId = isProfile ? modelIdFromPrefix(exampleProfile.prefix)
                                : exampleImportedLibrary.namespaceId;

  return [
    GroupPage.startModelCreation(type),
    AddModelModal.enterModelPrefix(type),
    AddModelModal.enterModelLanguage,
    AddModelModal.enterModelLabel(type, gettextCatalog),
    AddModelModal.createModel,
    NewModelPage.saveUnsavedModel,
    ModelPage.openModelDetails(type),
    ModelView.modifyModel(type),
    ...addNamespaceItems(gettextCatalog),
    ModelView.saveModelChanges,
    ...(isProfile ? specializeClassItems(gettextCatalog) : assignClassItems(gettextCatalog)),
    ...createNewClassItems(gettextCatalog),
    ...addAssociationItems(namespaceId, gettextCatalog)
  ];
}

export function finishedCreateNewModelNotification(type: KnownModelType): Notification {
  return createNotification({
    title: `Congratulations for completing ${type} creation!`,
    content: 'Diipadaa'
  });
}

function createNewModel(type: KnownModelType, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: `Guide through creating new ${type}`,
    description: 'Diipadaa',
    items: () => [
      ...createNewModelItems(type, gettextCatalog),
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
