import Dictionary = _.Dictionary;
import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import * as _ from 'lodash';
import { UsageService } from '../../services/usageService';
import { Attribute, Association, Class, Group, Model, Usage } from '../../services/entities';

type Entity = Class|Association|Attribute|Model|Group;

export class DeleteConfirmationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(entity: Entity, showUsage: boolean): IPromise<void> {
    return this.$uibModal.open({
      template: require('./deleteConfirmationModal.html'),
      size: 'adapting',
      controllerAs: 'ctrl',
      controller: DeleteConfirmationModalController,
      resolve: {
        entity: () => entity,
        showUsage: () => showUsage
      }
    }).result;
  }
};

class DeleteConfirmationModalController {

  usage: Usage;

  /* @ngInject */
  constructor(public entity: Entity, public showUsage: boolean, usageService: UsageService) {
    if (showUsage) {
      usageService.getUsage(entity.id).then(usage => this.usage = usage);
    }
  }
}
