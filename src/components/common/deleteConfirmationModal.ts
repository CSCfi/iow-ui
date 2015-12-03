import Dictionary = _.Dictionary;
import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import * as _ from 'lodash';
import { UsageService } from '../../services/usageService';
import { Attribute, Association, Class, Group, Model, Referrer, Type } from '../../services/entities';

export class DeleteConfirmationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(entity: Class|Association|Attribute|Model|Group, showUsages: boolean): IPromise<void> {
    return this.$uibModal.open({
      template: require('./deleteConfirmationModal.html'),
      size: 'adapting',
      controllerAs: 'ctrl',
      controller: DeleteConfirmationModalController,
      resolve: {
        entity: () => entity,
        showUsages: () => showUsages
      }
    }).result;
  }
};

export class DeleteConfirmationModalController {

  referrers: Dictionary<Referrer[]>;

  /* @ngInject */
  constructor(private usageService: UsageService, public entity: Class|Association|Attribute|Model|Group, showUsages: boolean) {
    if (showUsages) {
      usageService.getUsages(entity.id).then(usage => {
        if (usage && usage.referrers.length > 0) {
          this.referrers = _.groupBy<Referrer>(usage.referrers, 'type');
        }
      });
    }
  }
}
