import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import { ModelService } from '../../services/modelService';
import { ImportedNamespace, Model } from '../../services/entities';
import { Language } from '../../utils/language';

export class AddEditNamespaceModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(model: Model, language: Language, namespaceToEdit: ImportedNamespace): IPromise<ImportedNamespace> {
    return this.$uibModal.open({
      template: require('./addEditNamespaceModal.html'),
      size: 'small',
      controller: AddEditNamespaceController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        language: () => language,
        namespaceToEdit: () => namespaceToEdit
      }
    }).result;
  }

  openAdd(model: Model, language: Language): IPromise<ImportedNamespace> {
    return this.open(model, language, null);
  }

  openEdit(require: ImportedNamespace, model: Model, language: Language): IPromise<ImportedNamespace> {
    return this.open(model, language, require);
  }
};

class AddEditNamespaceController {

  namespace: string;
  prefix: string;
  label: string;

  submitError: string;
  edit: boolean;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, public model: Model, private language: Language, private namespaceToEdit: ImportedNamespace, private modelService: ModelService) {
    this.edit = !!namespaceToEdit;

    if (namespaceToEdit) {
      this.namespace = namespaceToEdit.namespace;
      this.prefix = namespaceToEdit.prefix;
      this.label = namespaceToEdit.label[language];
    }
  }

  get confirmLabel() {
    return this.edit ? 'Edit' : 'Create new';
  }

  get titleLabel() {
    return this.edit ? 'Edit namespace' : 'Import namespace';
  }

  labelModifiable() {
    return !this.edit || this.namespaceToEdit.labelModifiable;
  }

  namespaceModifiable() {
    return !this.edit || this.namespaceToEdit.namespaceModifiable;
  }

  prefixModifiable() {
    return !this.edit || this.namespaceToEdit.prefixModifiable;
  }

  create() {
    if (this.edit) {
      this.namespaceToEdit.namespace = this.namespace;
      this.namespaceToEdit.prefix = this.prefix;
      this.namespaceToEdit.label[this.language] = this.label;

      this.$uibModalInstance.close(this.namespaceToEdit);
    } else {
      // service call only for validation purposes
      this.modelService.newNamespaceImport(this.namespace, this.prefix, this.label, this.language)
        .then(ns => this.$uibModalInstance.close(ns), err => this.submitError = err.data.errorMessage);
    }
  }

  cancel() {
    this.$uibModalInstance.dismiss();
  }
}
