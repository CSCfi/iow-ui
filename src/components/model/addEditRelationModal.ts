import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { ModelService } from '../../services/modelService';
import { Link, Model } from '../../services/entities';
import { Uri } from '../../services/uri';
import { Language } from '../../utils/language';

export class AddEditRelationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(model: Model, lang: Language, relationToEdit: Link): IPromise<Link> {
    return this.$uibModal.open({
      template: require('./addEditRelationModal.html'),
      size: 'small',
      controller: AddEditRelationModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        lang: () => lang,
        relationToEdit: () => relationToEdit
      }
    }).result;
  }

  openAdd(model: Model, lang: Language): IPromise<Link> {
    return this.open(model, lang, null);
  }

  openEdit(relation: Link, model: Model, lang: Language): IPromise<Link> {
    return this.open(model, lang, relation);
  }
}

class AddEditRelationModalController {

  title: string;
  description: string;
  homepage: Uri;
  edit: boolean;

  cancel = this.$uibModalInstance.dismiss;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private modelService: ModelService, private lang: Language, private model: Model, private relationToEdit: Link) {
    this.edit = !!relationToEdit;

    if (relationToEdit) {
      this.title = relationToEdit.title[lang];
      this.description = relationToEdit.description[lang];
      this.homepage = relationToEdit.homepage;
    }
  }

  get confirmLabel() {
    return this.edit ? 'Edit' : 'Create new';
  }

  get titleLabel() {
    return this.edit ? 'Edit related resource' : 'Add related resource';
  }

  create() {
    if (this.edit) {
      this.relationToEdit.title[this.lang] = this.title;
      this.relationToEdit.description[this.lang] = this.description;
      this.relationToEdit.homepage = this.homepage;

      this.$uibModalInstance.close(this.relationToEdit);
    } else {
      this.modelService.newRelation(this.title, this.description, this.homepage, this.lang, this.model.context)
        .then(relation => this.$uibModalInstance.close(relation));
    }
  }
}
