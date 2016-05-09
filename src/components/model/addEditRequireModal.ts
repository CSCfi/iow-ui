import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { ModelService } from '../../services/modelService';
import { Require, Model } from '../../services/entities';
import { Language } from '../contracts';
import IQService = angular.IQService;

export class AddEditRequireModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(model: Model, language: Language, requireToEdit: Require): IPromise<Require> {
    return this.$uibModal.open({
      template: require('./addEditRequireModal.html'),
      size: 'small',
      controller: AddEditRequireController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        language: () => language,
        requireToEdit: () => requireToEdit
      }
    }).result;
  }

  openAdd(model: Model, language: Language): IPromise<Require> {
    return this.open(model, language, null);
  }

  openEdit(require: Require, model: Model, language: Language): IPromise<Require> {
    return this.open(model, language, require);
  }
};

class AddEditRequireController {

  namespace: string;
  prefix: string;
  label: string;

  submitError: string;
  edit: boolean;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, public model: Model, private language: Language, private requireToEdit: Require, private modelService: ModelService) {
    this.edit = !!requireToEdit;

    if (requireToEdit) {
      this.namespace = requireToEdit.namespace;
      this.prefix = requireToEdit.prefix;
      this.label = requireToEdit.label[language];
    }
  }

  get confirmLabel() {
    return this.edit ? 'Edit' : 'Create new';
  }

  get titleLabel() {
    return this.edit ? 'Edit require' : 'Add require';
  }

  labelModifiable() {
    return !this.edit || this.requireToEdit.labelModifiable;
  }

  namespaceModifiable() {
    return !this.edit || this.requireToEdit.namespaceModifiable;
  }

  prefixModifiable() {
    return !this.edit || this.requireToEdit.prefixModifiable;
  }

  create() {
    if (this.edit) {
      this.requireToEdit.namespace = this.namespace;
      this.requireToEdit.prefix = this.prefix;
      this.requireToEdit.label[this.language] = this.label;

      this.$uibModalInstance.close(this.requireToEdit);
    } else {
      // service call only for validation purposes
      this.modelService.newRequire(this.namespace, this.prefix, this.label, this.language)
        .then(newRequire => this.$uibModalInstance.close(newRequire), err => this.submitError = err.data.errorMessage);
    }
  }

  cancel() {
    this.$uibModalInstance.dismiss();
  }
}
