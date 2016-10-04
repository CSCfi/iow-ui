import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import { KnownPredicateType } from '../../services/entities';

export class ChoosePredicateTypeModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(): IPromise<KnownPredicateType> {
    return this.$uibModal.open({
      template: require('./choosePredicateTypeModal.html'),
      size: 'adapting',
      controllerAs: 'ctrl',
      controller: ChoosePredicateTypeModalController
    }).result;
  }
};

export class ChoosePredicateTypeModalController {
  type: KnownPredicateType = 'attribute';
}
