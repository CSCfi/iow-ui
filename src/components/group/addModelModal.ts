import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { ModelService } from '../../services/modelService';
import { Uri, Type } from '../../services/entities';

export class AddModelModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(groupId: Uri, type: Type): IPromise<{prefix: string, label: string, type: Type}> {
    return this.$uibModal.open({
      template: require('./addModelModal.html'),
      size: 'small',
      controller: AddModelController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        groupId: () => groupId,
        type: () => type
      }
    }).result;
  }
}

class AddModelController {

  prefix: string;
  label: string;
  submitError: string;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private modelService: ModelService, private groupId: Uri, public type: Type) {
  }

  cancel = this.$uibModalInstance.dismiss;
  create() {
    // service call only for validation purposes
    this.modelService.newModel(this.prefix, this.label, this.groupId, 'fi', this.type)
      .then(() => this.$uibModalInstance.close({prefix: this.prefix, label: this.label, type: this.type}), err => this.submitError = err.data.errorMessage);
  }
}
