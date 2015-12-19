import Dictionary = _.Dictionary;
import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import * as _ from 'lodash';
import { UsageService } from '../../services/usageService';
import { Attribute, Association, Class, Group, Model, Referrer, Type } from '../../services/entities';

type Entity = Class|Association|Attribute|Model|Group;

export class DeleteConfirmationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(entity: Entity, showUsages: boolean): IPromise<void> {
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

class DeleteConfirmationModalController {
  /* @ngInject */
  constructor(public entity: Entity, public showUsages: boolean) {
  }
}
