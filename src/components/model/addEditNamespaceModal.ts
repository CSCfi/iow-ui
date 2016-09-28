import { IScope, IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { ModelService } from '../../services/modelService';
import { ImportedNamespace, Model, NamespaceType } from '../../services/entities';
import { Language } from '../../utils/language';
import { isDefined } from '../../utils/object';

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
}

class AddEditNamespaceController {

  namespace: string;
  prefix: string;
  label: string;

  submitError: string;
  edit: boolean;

  namespaceBeforeForced: string;
  prefixBeforeForced: string;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, $scope: IScope, public model: Model, private language: Language, private namespaceToEdit: ImportedNamespace, private modelService: ModelService) {
    this.edit = !!namespaceToEdit;

    if (namespaceToEdit) {
      this.namespace = namespaceToEdit.namespace;
      this.prefix = namespaceToEdit.prefix;
      this.label = namespaceToEdit.label[language];
    }

    if (!this.edit) {

      $scope.$watch(() => this.prefix, () => {
        if (this.prefixModifiable()) {

          const namespaceOverrideWasOn = isDefined(this.namespaceBeforeForced);
          let namespaceOverrideSwitchedOn = false;

          for (const [prefix, ns] of Object.entries(model.getNamespacesOfType(NamespaceType.IMPLICIT_TECHNICAL))) {
            if (prefix === this.prefix) {
              namespaceOverrideSwitchedOn = true;
              this.namespaceBeforeForced = this.namespace || '';
              this.namespace = ns;
            }
          }

          if (namespaceOverrideWasOn && !namespaceOverrideSwitchedOn) {
            this.namespace = this.namespaceBeforeForced;
            this.namespaceBeforeForced = null;
          }
        }
      });

      $scope.$watch(() => this.namespace, () => {
        if (this.namespaceModifiable()) {

          const prefixOverrideWasOn = isDefined(this.prefixBeforeForced);
          let prefixOverrideSwitchedOn = false;

          for (const [prefix, ns] of Object.entries(model.getNamespacesOfType(NamespaceType.IMPLICIT_TECHNICAL))) {
            if (ns === this.namespace) {
              prefixOverrideSwitchedOn = true;
              this.prefixBeforeForced = this.prefix || '';
              this.prefix = prefix;
            }
          }

          if (prefixOverrideWasOn && !prefixOverrideSwitchedOn) {
            this.prefix = this.prefixBeforeForced;
            this.prefixBeforeForced = null;
          }
        }
      });
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
    return (!this.edit || this.namespaceToEdit.namespaceModifiable) && !isDefined(this.namespaceBeforeForced);
  }

  prefixModifiable() {
    return (!this.edit || this.namespaceToEdit.prefixModifiable) && !isDefined(this.prefixBeforeForced);
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
        .then(ns => {
          if (!this.namespaceModifiable() || !this.prefixModifiable()) {
            ns.type = ['standard'];
          }
          return this.$uibModalInstance.close(ns);
        }, err => this.submitError = err.data.errorMessage);
    }
  }

  cancel() {
    this.$uibModalInstance.dismiss();
  }
}
