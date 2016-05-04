import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { ModelService } from '../../services/modelService';
import { Type } from '../../services/entities';
import { Uri } from '../../services/uri';
import { Language } from '../contracts';

export class AddModelModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(groupId: Uri, type: Type): IPromise<{prefix: string, label: string, language: Language[], type: Type}> {
    return this.$uibModal.open({
      template: require('./addModelModal.html'),
      size: 'small',
      controller: AddModelController,
      controllerAs: 'ctrl',
      backdrop: true,
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
  language: Language[] = ['fi', 'en'];
  submitError: string;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private modelService: ModelService, private groupId: Uri, public type: Type) {
  }

  cancel = this.$uibModalInstance.dismiss;
  create() {
    // service call only for validation purposes
    this.modelService.newModel(this.prefix, this.label, this.groupId, this.language, this.type)
      .then(() => this.$uibModalInstance.close({prefix: this.prefix, label: this.label, language: this.language, type: this.type}), err => this.submitError = err.data.errorMessage);
  }
}
