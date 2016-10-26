import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  createHelpWithDefaultHandler, createNotification, InteractiveHelp
} from './contract';
import { startModelCreation } from './pages/group/groupPageHelp.po';
import {
  enterModelLanguage, createModel,
  enterModelPrefix, enterModelLabel
} from './pages/group/modal/addModelModalHelp.po';
import { saveUnsavedModel } from './pages/model/newModelPageHelp.po';
import { Group } from '../entities/group';
import { KnownModelType } from '../entities/type';
import { saveModelChanges, requireNamespace, modifyModel } from './pages/model/modelViewHelp.po';
import { selectJhsResult, filterForJhs } from './pages/model/modal/addEditNamepaceModalHelp.po';
import { openModelDetails } from './pages/model/modelPageHelp.po';

export function createNewModelItems(type: KnownModelType) {
  return [
    startModelCreation(type),
    enterModelPrefix(type),
    enterModelLanguage,
    enterModelLabel(type),
    createModel,
    saveUnsavedModel,
    openModelDetails(type),
    modifyModel(type),
    requireNamespace,
    filterForJhs,
    selectJhsResult,
    saveModelChanges
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
