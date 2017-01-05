import { IPromise, ILocationService, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import { Model } from '../../entities/model';
import { identity } from '../../utils/function';
import { modalCancelHandler } from '../../utils/angular';

export class NotificationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService, private $location: ILocationService) {
  }

  private open(title: string, body: string): IPromise<any> {
    const modal = this.$uibModal.open({
      template:
        `
          <modal-template purpose="warning">
          
            <modal-title translate>${title}</modal-title>
          
            <modal-body>
              <span translate>${body}</span>
            </modal-body>
          
            <modal-buttons>
              <button class="btn btn-primary" type="button" ng-click="$close('cancel')" translate>Close</button>
            </modal-buttons>
                      
          </modal-template>
        `,
      size: 'adapting'
    });

    return modal.result.then(() => true, _err => true);
  }

  openNotLoggedIn() {
    this.open('Session expired', 'Please login to perform the action').then(identity, modalCancelHandler);
  }

  openModelNotFound() {
    this.open('Model not found', 'You will be redirected to the front page').then(() => this.$location.url('/'), modalCancelHandler);
  }

  openGroupNotFound() {
    this.open('Group not found', 'You will be redirected to the front page').then(() => this.$location.url('/'), modalCancelHandler);
  }

  openPageNotFound() {
    this.open('Page not found', 'You will be redirected to the front page').then(() => this.$location.url('/'), modalCancelHandler);
  }

  openResourceNotFound(model: Model) {
    return this.open('Resource not found', 'You will be redirected to the model').then(() => this.$location.url(model.iowUrl()), modalCancelHandler);
  }
}
