import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { Predicate, Model, Association, Attribute } from '../../services/entities';
import { Uri } from '../../services/uri';

export class CopyPredicateModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(predicate: Association|Attribute, model: Model): IPromise<Predicate> {
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
              ng-disabled="form.$invalid || form.$pending || !ctrl.predicate.subject">
                {{'Copy' | translate}}
              </button>
            </modal-buttons>
          </modal-template>
        </form>
      `,
      size: 'medium',
      controllerAs: 'ctrl',
      resolve: {
        predicate: () => predicate,
        model: () => model
      },
      controller: CopyPredicateModalController
    }).result;
  }
};

export class CopyPredicateModalController {

  predicate: Predicate;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, predicate: Association|Attribute, public model: Model) {
    this.predicate = predicate.clone();
    model.expandContextWithKnownModels(predicate.context);
    this.predicate.state = 'Unstable';
    this.predicate.unsaved = true;
    this.predicate.id = new Uri(model.namespace + predicate.id.name, predicate.context);
    this.predicate.definedBy = model.asDefinedBy();
  }

  confirm() {
    this.$uibModalInstance.close(this.predicate);
  }
}
