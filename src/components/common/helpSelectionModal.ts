import { ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { StoryLine } from '../../help/contract';
import { InteractiveHelp } from './interactiveHelp';

export class HelpSelectionModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(storyLines: StoryLine[]) {
    this.$uibModal.open({
      template: `
        <modal-template>
          <modal-title translate>Select help topic</modal-title>
       
          <modal-body>
            <div class="help story-line" ng-repeat="storyLine in ctrl.storyLines" ng-click="ctrl.startStoryLine(storyLine)">
              <h5>{{storyLine.title | translate}}</h5>
              <div>{{storyLine.description | translate | paragraphize}}</div>
            </div>
          </modal-body>
         
          <modal-buttons>
            <button class="btn btn-primary" type="button" ng-click="$close('cancel')" translate>Close</button>
          </modal-buttons>
        </modal-template>
      `,
      size: 'medium',
      controllerAs: 'ctrl',
      controller: HelpSelectionModalController,
      resolve: {
        storyLines: () => storyLines
      }
    });
  }
}

class HelpSelectionModalController {

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, public storyLines: StoryLine[], private interactiveHelp: InteractiveHelp) {
  }

  startStoryLine(storyLine: StoryLine) {
    this.$uibModalInstance.close();
    this.interactiveHelp.open(storyLine);
  }
}
