import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import IScope = angular.IScope;

interface ConfirmationModalScope extends IScope {
  confirmationModal: boolean;
}

export function isConfirmationModalScope($scope: IScope): $scope is ConfirmationModalScope {
  return $scope['confirmationModal'] === true;
}

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
      controller($scope: ConfirmationModalScope) {
        this.title = title;
        this.body = body;
        $scope.confirmationModal = true;
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
