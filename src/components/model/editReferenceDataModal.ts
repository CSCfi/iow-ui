import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { Model, ReferenceData } from '../../services/entities';
import { Uri } from '../../services/uri';
import { Language } from '../../utils/language';

export class EditReferenceDataModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(model: Model, lang: Language, referenceDataToEdit: ReferenceData): IPromise<ReferenceData> {
    return this.$uibModal.open({
      template: require('./editReferenceDataModal.html'),
      size: 'small',
      controller: EditReferenceDataModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        lang: () => lang,
        referenceDataToEdit: () => referenceDataToEdit
      }
    }).result;
  }

  openEdit(referenceData: ReferenceData, model: Model, lang: Language): IPromise<ReferenceData> {
    return this.open(model, lang, referenceData);
  }
}

class EditReferenceDataModalController {

  id: Uri;
  title: string;
  description: string;

  cancel = this.$uibModalInstance.dismiss;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private lang: Language, public model: Model, private referenceDataToEdit: ReferenceData) {
    this.id = referenceDataToEdit.id;
    this.title = referenceDataToEdit.title[lang];
    this.description = referenceDataToEdit.description[lang];
  }

  create() {
    this.referenceDataToEdit.id = this.id;
    this.referenceDataToEdit.title[this.lang] = this.title;
    this.referenceDataToEdit.description[this.lang] = this.description;

    this.$uibModalInstance.close(this.referenceDataToEdit);
  }
}
