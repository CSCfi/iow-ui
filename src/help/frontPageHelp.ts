import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { StoryLine, HelpEventHandler, augmentHandlers } from './contract';
import { selectGroup } from './pages/frontPageHelp.po';
import { createNewLibrary } from './groupPageHelp';

const selectGroupAndCreateNewLibrary = Object.assign({}, createNewLibrary, {
  items: [selectGroup, ...createNewLibrary.items]
});

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
    return [augmentHandlers(selectGroupAndCreateNewLibrary, this.returnToFrontPageHandler)];
  }
}
