import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  createHelpWithDefaultHandler, createNotification, InteractiveHelp
} from './contract';
import { Group } from '../entities/group';
import { KnownModelType } from '../entities/type';
import * as GroupPage from './pages/group/groupPageHelp.po';
import * as AddModelModal from './pages/group/modal/addModelModalHelp.po';
import * as NewModelPage from './pages/model/newModelPageHelp.po';
import * as ModelPage from './pages/model/modelPageHelp.po';
import * as ModelView from './pages/model/modelViewHelp.po';
import { addNamespaceItems, specializeClassItems, createNewClassItems, addAssociationItems } from './modelPageHelp';

export function createNewModelItems(type: KnownModelType) {
  return [
    GroupPage.startModelCreation(type),
    AddModelModal.enterModelPrefix(type),
    AddModelModal.enterModelLanguage,
    AddModelModal.enterModelLabel(type),
    AddModelModal.createModel,
    NewModelPage.saveUnsavedModel,
    ModelPage.openModelDetails(type),
    ModelView.modifyModel(type),
    ...addNamespaceItems,
    ModelView.saveModelChanges,
    ...(type === 'profile' ? specializeClassItems : []),
    ...createNewClassItems,
    ...(type === 'profile' ? addAssociationItems : [])
  ];
}

export function finishedCreateNewModelNotification(type: KnownModelType) {
  return createNotification({
    title: `Congratulations for completing ${type} creation!`,
    content: 'Diipadaa'
  });
}

function createNewModel(type: KnownModelType) {
  return {
    title: `Guide through creating new ${type}`,
    description: 'Diipadaa',
    items: [
      ...createNewModelItems(type),
      finishedCreateNewModelNotification(type)
    ]
  };
}

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
      createHelpWithDefaultHandler(createNewModel('library'), () => this.returnToGroupPage(group)),
      createHelpWithDefaultHandler(createNewModel('profile'), () => this.returnToGroupPage(group))
    ];
  }
}
