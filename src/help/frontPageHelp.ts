import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { createHelpWithDefaultHandler, InteractiveHelp, StoryLine } from './contract';
import { selectGroup } from './pages/frontPageHelp.po';
import * as GroupPage from './groupPageHelp';
import { KnownModelType } from '../entities/type';

function createNewModel(type: KnownModelType): StoryLine {
  return {
    title: `Guide through creating new ${type}`,
    description: `Guide through creating new ${type} description`,
    items: [
      selectGroup,
      ...GroupPage.createNewModelItems(type),
      GroupPage.finishedCreateNewModelNotification(type)
    ]
  };
}

export class FrontPageHelpService {

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService, private $location: ILocationService) {
  }

  private returnToFrontPage() {
    this.$uibModalStack.dismissAll();
    this.$location.url('/');
  }

  getHelps(): InteractiveHelp[] {
    return [
      createHelpWithDefaultHandler(createNewModel('library'), this.returnToFrontPage.bind(this)),
      createHelpWithDefaultHandler(createNewModel('profile'), this.returnToFrontPage.bind(this))
    ];
  }
}
