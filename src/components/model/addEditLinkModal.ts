import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { ModelService } from '../../services/modelService';
import { Link, Model } from '../../services/entities';
import { Uri } from '../../services/uri';
import { Language } from '../../utils/language';

export class AddEditLinkModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(model: Model, lang: Language, linkToEdit: Link): IPromise<Link> {
    return this.$uibModal.open({
      template: require('./addEditLinkModal.html'),
      size: 'small',
      controller: AddEditLinkModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        lang: () => lang,
        linkToEdit: () => linkToEdit
      }
    }).result;
  }

  openAdd(model: Model, lang: Language): IPromise<Link> {
    return this.open(model, lang, null);
  }

  openEdit(link: Link, model: Model, lang: Language): IPromise<Link> {
    return this.open(model, lang, link);
  }
}

class AddEditLinkModalController {

  title: string;
  description: string;
  homepage: Uri;
  edit: boolean;

  cancel = this.$uibModalInstance.dismiss;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private modelService: ModelService, private lang: Language, private model: Model, private linkToEdit: Link) {
    this.edit = !!linkToEdit;

    if (linkToEdit) {
      this.title = linkToEdit.title[lang];
      this.description = linkToEdit.description[lang];
      this.homepage = linkToEdit.homepage;
    }
  }

  get confirmLabel() {
    return this.edit ? 'Edit' : 'Create new';
  }

  get titleLabel() {
    return this.edit ? 'Edit link' : 'Add link';
  }

  create() {
    if (this.edit) {
      this.linkToEdit.title[this.lang] = this.title;
      this.linkToEdit.description[this.lang] = this.description;
      this.linkToEdit.homepage = this.homepage;

      this.$uibModalInstance.close(this.linkToEdit);
    } else {
      this.modelService.newLink(this.title, this.description, this.homepage, this.lang, this.model.context)
        .then(link => this.$uibModalInstance.close(link));
    }
  }
}
