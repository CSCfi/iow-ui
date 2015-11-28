import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { ModelService } from '../../services/modelService';
import { Language } from '../../services/languageService';
import { Require } from '../../services/entities';

export class AddRequireModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(language: Language): IPromise<Require> {
    return this.$uibModal.open({
      template: require('./addRequireModal.html'),
      size: 'small',
      controller: AddRequireController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        language: () => language
      }
    }).result;
  }
};

class AddRequireController {

  namespace: string;
  prefix: string;
  label: string;
  submitError: boolean;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private language: Language, private modelService: ModelService) {
  }

  create() {
    return this.modelService.newRequire(this.namespace, this.prefix, this.label, this.language)
      .then(newRequire => this.$uibModalInstance.close(newRequire), err => this.submitError = true);
  }

  cancel() {
    this.$uibModalInstance.dismiss();
  }
}
