import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;

export class AddModelModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(): IPromise<{prefix: string, label: string}> {
    return this.$uibModal.open({
      template: require('./addModelModal.html'),
      size: 'small',
      controller: AddModelController,
      controllerAs: 'ctrl',
      backdrop: false
    }).result;
  }
}

class AddModelController {

  prefix: string;
  label: string;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance) {
  }

  cancel = this.$uibModalInstance.dismiss;
  create() {
    this.$uibModalInstance.close({prefix: this.prefix, label: this.label});
  }
}
