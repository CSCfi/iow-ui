import { ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { InteractiveHelp } from '../../help/contract';
import { InteractiveHelpDisplay } from '../../help/components/interactiveHelpDisplay';

export class HelpSelectionModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(helps: InteractiveHelp[]) {
    this.$uibModal.open({
      template: `
        <modal-template>
          <modal-title translate>Select help topic</modal-title>
       
          <modal-body>
            <div class="help story-line" ng-repeat="help in ctrl.helps" ng-click="ctrl.startHelp(help)">
              <h5>{{help.storyLine.title | translate}}</h5>
              <div>{{help.storyLine.description | translate | paragraphize}}</div>
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
        helps: () => helps
      }
    });
  }
}

class HelpSelectionModalController {

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, public helps: InteractiveHelp[], private interactiveHelpDisplay: InteractiveHelpDisplay) {
  }

  startHelp(help: InteractiveHelp) {
    this.$uibModalInstance.close();
    this.interactiveHelpDisplay.open(help);
  }
}
