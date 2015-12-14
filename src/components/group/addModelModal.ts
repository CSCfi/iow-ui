import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { ModelService } from '../../services/modelService';
import { Uri } from '../../services/entities';

export class AddModelModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(groupId: Uri): IPromise<{prefix: string, label: string}> {
    return this.$uibModal.open({
      template: require('./addModelModal.html'),
      size: 'small',
      controller: AddModelController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        groupId: () => groupId
      }
    }).result;
  }
}

class AddModelController {

  prefix: string;
  label: string;
  submitError: string;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private modelService: ModelService, private groupId: Uri) {
  }

  cancel = this.$uibModalInstance.dismiss;
  create() {
    this.modelService.newModel(this.prefix, this.label, this.groupId, 'fi')
      .then(() => this.$uibModalInstance.close({prefix: this.prefix, label: this.label}), err => this.submitError = err.data.errorMessage);
  }
}
