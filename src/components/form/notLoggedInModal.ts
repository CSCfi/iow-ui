import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;

export class NotLoggedInModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(): IPromise<void> {
    return this.$uibModal.open({
      template:
        `
          <modal-template purpose="warning">
          
            <modal-title translate>Session expired</modal-title>
          
            <modal-body>
              <span translate>Please login to perform the action</span>
            </modal-body>
          
            <modal-buttons>
              <button class="btn btn-primary" type="button" ng-click="$dismiss('cancel')" translate>Close</button>
            </modal-buttons>
                      
          </modal-template>
        `,
      size: 'adapting'
    }).result;
  }
}
