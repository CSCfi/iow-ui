import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import { Usage } from '../../entities/usage';
import { LanguageContext } from '../../entities/contract';

interface UsageParameters {
  usage: Usage;
  context: LanguageContext;
}

export class ErrorModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(title: string, errorMessage: string, usage: UsageParameters|null): IPromise<void> {
    return this.$uibModal.open({
      template:
        `
          <modal-template purpose="danger">
          
            <modal-title>
              <i class="fa fa-exclamation-circle"></i>
              {{ctrl.title | translate}}
            </modal-title>
          
            <modal-body>
              <p>{{ctrl.errorMessage | translate}}</p>
              <usage ng-if="ctrl.usage" usage="ctrl.usage.usage" context="ctrl.usage.context"></usage>
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
        errorMessage: () => errorMessage,
        usage: () => usage
      }
    }).result;
  }

  openSubmitError(errorMessage: string) {
    return this.open('Submit error', errorMessage, null);
  }

  openUsageError(title: string, errorMessage: string, usage: Usage, context: LanguageContext) {
    return this.open(title, errorMessage, { usage, context });
  }
}

class ErrorModalController {
  /* @ngInject */
  constructor(public title: string, public errorMessage: string, public usage: UsageParameters|null) {
  }
}
