import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { ModelService } from '../../services/modelService';
import { Require, Model } from '../../services/entities';
import { Language } from '../contracts';

export class AddRequireModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(model: Model, language: Language): IPromise<Require> {
    return this.$uibModal.open({
      template: require('./addRequireModal.html'),
      size: 'small',
      controller: AddRequireController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        language: () => language
      }
    }).result;
  }
};

class AddRequireController {

  namespace: string;
  prefix: string;
  label: string;
  submitError: string;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, public model: Model, private language: Language, private modelService: ModelService) {
  }

  create() {
    // service call only for validation purposes
    return this.modelService.newRequire(this.namespace, this.prefix, this.label, this.language)
      .then(newRequire => this.$uibModalInstance.close(newRequire), err => this.submitError = err.data.errorMessage);
  }

  cancel() {
    this.$uibModalInstance.dismiss();
  }
}
