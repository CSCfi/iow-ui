import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { createHelpWithDefaultHandler, InteractiveHelp } from './contract';
import { selectGroup } from './pages/frontPageHelp.po';
import { createNewModelItems, finishedCreateNewModelNotification } from './groupPageHelp';
import { KnownModelType } from '../entities/type';

function createNewModel(type: KnownModelType) {
  return {
    title: `Guide through creating new ${type}`,
    description: 'Diipadaa',
    items: [
      selectGroup,
      ...createNewModelItems(type),
      finishedCreateNewModelNotification(type)
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
