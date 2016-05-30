import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { Model, ReferenceData } from '../../services/entities';
import { Uri } from '../../services/uri';
import { Language } from '../../utils/language';

export class EditCodeSchemeModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(model: Model, lang: Language, codeSchemeToEdit: ReferenceData): IPromise<ReferenceData> {
    return this.$uibModal.open({
      template: require('./editCodeSchemeModal.html'),
      size: 'small',
      controller: EditCodeSchemeModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        lang: () => lang,
        codeSchemeToEdit: () => codeSchemeToEdit
      }
    }).result;
  }

  openEdit(codeScheme: ReferenceData, model: Model, lang: Language): IPromise<ReferenceData> {
    return this.open(model, lang, codeScheme);
  }
}

class EditCodeSchemeModalController {

  id: Uri;
  title: string;
  description: string;

  cancel = this.$uibModalInstance.dismiss;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private lang: Language, public model: Model, private codeSchemeToEdit: ReferenceData) {
    this.id = codeSchemeToEdit.id;
    this.title = codeSchemeToEdit.title[lang];
    this.description = codeSchemeToEdit.description[lang];
  }

  create() {
    this.codeSchemeToEdit.id = this.id;
    this.codeSchemeToEdit.title[this.lang] = this.title;
    this.codeSchemeToEdit.description[this.lang] = this.description;

    this.$uibModalInstance.close(this.codeSchemeToEdit);
  }
}
