import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import IScope = angular.IScope;

export class ConfirmationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(title: string, body: string): IPromise<void> {
    return this.$uibModal.open({
      template: `<modal-template default="true">
                   <modal-title>{{ctrl.title | translate}}</modal-title>
                   <modal-body>{{ctrl.body | translate}}</modal-body>
                 </modal-template>`,
      controllerAs: 'ctrl',
      /* @ngInject */
      controller() {
        this.title = title;
        this.body = body;
      }
    }).result;
  }

  openEditInProgress() {
    return this.open('Edit in progress', 'Are you sure that you want to cancel edit?');
  }

  openCloseModal() {
    return this.open('Dialog is open', 'Are you sure that you want to close dialog?');
  }
};
