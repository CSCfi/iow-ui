import Dictionary = _.Dictionary;
import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import { UsageService } from '../../services/usageService';
import { Usage, EditableEntity } from '../../services/entities';

export class DeleteConfirmationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(entity: EditableEntity, showUsage: boolean): IPromise<void> {
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
  constructor(public entity: EditableEntity, public showUsage: boolean, usageService: UsageService) {
    if (showUsage) {
      usageService.getUsage(entity).then(usage => this.usage = usage);
    }
  }
}
