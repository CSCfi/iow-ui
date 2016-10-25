import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { createHelpWithDefaultHandler, InteractiveHelp } from './contract';
import { selectGroup } from './pages/frontPageHelp.po';
import { createNewLibrary, createNewProfile } from './groupPageHelp';

const selectGroupAndCreateNewLibrary = Object.assign({}, createNewLibrary, {
  items: [selectGroup, ...createNewLibrary.items]
});

const selectGroupAndCreateNewProfile = Object.assign({}, createNewProfile, {
  items: [selectGroup, ...createNewProfile.items]
});

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
      createHelpWithDefaultHandler(selectGroupAndCreateNewLibrary, this.returnToFrontPage.bind(this)),
      createHelpWithDefaultHandler(selectGroupAndCreateNewProfile, this.returnToFrontPage.bind(this))
    ];
  }
}
