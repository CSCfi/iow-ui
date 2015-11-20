import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { Reference, Uri } from '../../services/entities';

export type ConceptSuggestionCreation = {concept: {label: string, comment: string, schemeId: Uri}, label: string}

export class AddConceptModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(defineConceptTitle: string, conceptLabel: string, reference: Reference): IPromise<ConceptSuggestionCreation> {
    return this.$uibModal.open({
      template: require('./addConceptModal.html'),
      size: 'small',
      controller: AddConceptController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        defineConceptTitle: () => defineConceptTitle,
        conceptLabel: () => conceptLabel,
        reference: () => reference
      }
    }).result;
  }
};

class AddConceptController {

  label: string;
  conceptComment: string;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              public defineConceptTitle: string,
              public conceptLabel: string,
              public reference: Reference) {

    $scope.$watch(() => this.conceptLabel, label => this.label = label);
  }

  create() {
    this.$uibModalInstance.close(
      {
        concept: {
          label: this.conceptLabel,
          comment: this.conceptComment,
          schemeId: this.reference.id
        },
        label: this.label
      }
    );
  };

  cancel() {
    return this.$uibModalInstance.dismiss;
  }
}
