import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import { ModelService } from '../../services/modelService';
import { Relation, Model } from '../../services/entities';
import { Language } from '../../services/languageService';
import { Uri } from '../../services/uri';

export class AddRelationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(model: Model, lang: Language): IPromise<Relation> {
    return this.$uibModal.open({
      template: require('./addRelationModal.html'),
      size: 'small',
      controller: AddRelationModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        lang: () => lang
      }
    }).result;
  }
}

class AddRelationModalController {

  title: string;
  description: string;
  homepage: Uri;

  cancel = this.$uibModalInstance.dismiss;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private modelService: ModelService, private lang: Language, private model: Model) {
  }

  create() {
    this.modelService.newRelation(this.title, this.description, this.homepage, this.lang, this.model.context)
      .then(relation => this.$uibModalInstance.close(relation));
  }
}
