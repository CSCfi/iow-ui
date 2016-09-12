import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { ReferenceData, LanguageContext } from '../../services/entities';

export class ViewReferenceDataModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(referenceData: ReferenceData, context: LanguageContext): IPromise<any> {
    return this.$uibModal.open({
      template: `
        <form>
          <modal-template>
            <modal-title translate>Reference data information</modal-title>
            
            <modal-body>
              <reference-data-view reference-data="ctrl.referenceData" context="ctrl.context" class="popup" show-codes="true"></reference-data-view>
            </modal-body>
            
            <modal-buttons>
              <button class="btn btn-primary" type="button" ng-click="$dismiss('cancel')" translate>Close</button>
            </modal-buttons>
          </modal-template>
        </form>
      `,
      size: 'adapting',
      controller: ViewReferenceDataModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        referenceData: () => referenceData,
        context: () => context
      }
    }).result;
  }
}

export class ViewReferenceDataModalController {

  /* @ngInject */
  constructor(public referenceData: ReferenceData, public context: LanguageContext) {
  }
}
