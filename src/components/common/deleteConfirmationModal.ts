import Dictionary = _.Dictionary;
import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import * as _ from 'lodash';
import { UsageService } from '../../services/usageService';
import { Usage, EditableEntity, Model, Referrer, LanguageContext } from '../../services/entities';

export class DeleteConfirmationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(entity: EditableEntity, context: LanguageContext, onlyInDefinedModel: Model = null): IPromise<void> {
    return this.$uibModal.open({
      template: require('./deleteConfirmationModal.html'),
      size: 'adapting',
      controllerAs: 'ctrl',
      controller: DeleteConfirmationModalController,
      resolve: {
        entity: () => entity,
        context: () => context,
        onlyInDefinedModel: () => onlyInDefinedModel
      }
    }).result;
  }
};

class DeleteConfirmationModalController {

  usage: Usage;
  hasReferrers: boolean;

  exclude = (referrer: Referrer) => this.onlyInDefinedModel && (referrer.isOfType('model') || referrer.definedBy.id.notEquals(this.onlyInDefinedModel.id));

  /* @ngInject */
  constructor(public entity: EditableEntity, public context: LanguageContext, private onlyInDefinedModel: Model, usageService: UsageService) {
    usageService.getUsage(entity).then(usage => {
      this.usage = usage;
      this.hasReferrers = usage && _.any(usage.referrers, referrer => !this.exclude(referrer));
    });
  }
}
