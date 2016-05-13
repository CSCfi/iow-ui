import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { CodeScheme, LanguageContext } from '../../services/entities';

export class ViewCodeSchemeModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(codeScheme: CodeScheme, context: LanguageContext): IPromise<any> {
    return this.$uibModal.open({
      template: `
        <form>
          <modal-template>
            <modal-title translate>Code scheme information</modal-title>
            
            <modal-body>
              <code-scheme-view code-scheme="ctrl.codeScheme" context="ctrl.context" class="popup"></code-scheme-view>
            </modal-body>
            
            <modal-buttons>
              <button class="btn btn-primary" type="button" ng-click="$dismiss('cancel')" translate>Close</button>
            </modal-buttons>
          </modal-template>
        </form>
      `,
      size: 'small',
      controller: ViewCodeSchemeModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        codeScheme: () => codeScheme,
        context: () => context
      }
    }).result;
  }
}

export class ViewCodeSchemeModalController {
  /* @ngInject */
  constructor(public codeScheme: CodeScheme, public context: LanguageContext) {
  }
}
