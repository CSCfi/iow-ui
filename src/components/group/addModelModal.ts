import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { ModelService } from '../../services/modelService';
import { Type } from '../../services/entities';
import { Uri } from '../../services/uri';
import { Language } from '../../utils/language';

export class AddModelModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(groupId: Uri, type: Type): IPromise<{prefix: string, label: string, language: Language[], type: Type, redirect: Uri}> {
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
  redirect: Uri;
  submitError: string;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private modelService: ModelService, private groupId: Uri, public type: Type) {
  }

  cancel = this.$uibModalInstance.dismiss;
  create() {
    // service call only for validation purposes
    this.modelService.newModel(this.prefix, this.label, this.groupId, this.language, this.type, this.redirect)
      .then(() => this.$uibModalInstance.close({prefix: this.prefix, label: this.label, language: this.language, type: this.type, redirect: this.redirect}),
        err => this.submitError = err.data.errorMessage);
  }
}
