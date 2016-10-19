import { ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;

export class NotificationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(title: string, body: string, onClose: () => void = () => {}): void {
    const modal = this.$uibModal.open({
      template:
        `
          <modal-template purpose="warning">
          
            <modal-title translate>${title}</modal-title>
          
            <modal-body>
              <span translate>${body}</span>
            </modal-body>
          
            <modal-buttons>
              <button class="btn btn-primary" type="button" ng-click="$dismiss('cancel')" translate>Close</button>
            </modal-buttons>
                      
          </modal-template>
        `,
      size: 'adapting'
    });

    modal.result.then(onClose, onClose);
  }

  openNotLoggedIn() {
    this.open('Session expired', 'Please login to perform the action');
  }
}
