import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { PredicateService } from '../../services/predicateService';
import { Uri } from '../../services/uri';
import { Predicate } from '../../entities/predicate';
import { Model } from '../../entities/model';

export class CopyPredicateModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(predicate: Predicate|Uri, type: 'attribute' | 'association', model: Model): IPromise<Predicate> {
    return this.$uibModal.open({
      template: `
        <form name="form">
          <modal-template>
            <modal-title>{{'Copy' | translate}} {{ctrl.predicate.type | translate}}</modal-title>
          
            <modal-body>
              <div class="row">
                <div class="col-md-12">
                  <model-language-chooser context="ctrl.model"></model-language-chooser>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12">
                  <predicate-form predicate="ctrl.predicate" old-predicate="ctrl.predicate" model="ctrl.model"></predicate-form>
                </div>
              </div>
            </modal-body>
          
            <modal-buttons>
              <button class="btn btn-default" type="button" ng-click="$dismiss('cancel')" translate>Cancel</button>
              <button type="button"
                      class="btn btn-default confirm"
                      ng-click="ctrl.confirm()"
                      ng-disabled="form.$invalid || form.$pending || !ctrl.predicate.subject">{{'Copy' | translate}}
              </button>
            </modal-buttons>
          </modal-template>
        </form>
      `,
      size: 'medium',
      controllerAs: 'ctrl',
      resolve: {
        predicate: () => predicate,
        type: () => type,
        model: () => model
      },
      controller: CopyPredicateModalController
    }).result;
  }
}

export class CopyPredicateModalController {

  predicate: Predicate;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance,
              predicateService: PredicateService,
              predicate: Predicate|Uri,
              type: 'attribute' | 'association',
              public model: Model) {

    predicateService.copyPredicate(predicate, type, model).then(copied => this.predicate = copied);
  }

  confirm() {
    this.$uibModalInstance.close(this.predicate);
  }
}
