import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import IScope = angular.IScope;

export class ErrorModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(title: string, errorMessage: string): IPromise<void> {
    return this.$uibModal.open({
      template:
        `
          <modal-template>
          
            <modal-title>{{ctrl.title | translate}}</modal-title>
          
            <modal-body>
              <error-panel error="ctrl.errorMessage"></error-panel>
            </modal-body>
          
            <modal-buttons>
              <button class="btn btn-primary" type="button" ng-click="$dismiss('cancel')" translate>Close</button>
            </modal-buttons>
                      
          </modal-template>
        `,
      size: 'adapting',
      controllerAs: 'ctrl',
      controller: ErrorModalController,
      resolve: {
        title: () => title,
        errorMessage: () => errorMessage
      }
    }).result;
  }

  openSubmitError(errorMessage: string) {
    return this.open('Submit error', errorMessage);
  }
};

class ErrorModalController {
  /* @ngInject */
  constructor(public title: string, public errorMessage: string) {
  }
}
