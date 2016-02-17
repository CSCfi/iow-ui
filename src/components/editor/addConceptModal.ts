import Dataset = Twitter.Typeahead.Dataset;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { Reference, Uri, FintoConcept } from '../../services/entities';
import { ConceptService } from '../../services/conceptService';
import { ConceptDatasets } from '../../services/conceptDatasets';

export type ConceptSuggestionCreation = {concept: {label: string, comment: string, schemeId: Uri, broaderConceptId: Uri}, label: string}

export class AddConceptModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(labelTitle: string, defineConceptTitle: string, conceptLabel: string, reference: Reference): IPromise<ConceptSuggestionCreation> {
    return this.$uibModal.open({
      template: require('./addConceptModal.html'),
      size: 'small',
      controller: AddConceptController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        labelTitle: () => labelTitle,
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

  dataset: Dataset;
  broaderConcept: FintoConcept;
  mapSelection = this.conceptDatasets.mapSelection.bind(this.conceptDatasets);

  options = {
    hint: false,
    highlight: true,
    minLength: 3,
    editable: false
  };

  /* @ngInject */
  constructor(private $scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              public labelTitle: string,
              public defineConceptTitle: string,
              public conceptLabel: string,
              public reference: Reference,
              public conceptDatasets: ConceptDatasets) {

    this.dataset = conceptDatasets.createConceptDataSet(reference, 1000);

    $scope.$watch(() => this.conceptLabel, label => this.label = label);
  }

  create() {
    this.$uibModalInstance.close(
      {
        concept: {
          label: this.conceptLabel,
          comment: this.conceptComment,
          schemeId: this.reference.id,
          broaderConceptId: this.broaderConcept ? this.broaderConcept.id : null,
        },
        label: this.label
      }
    );
  };

  cancel() {
    return this.$uibModalInstance.dismiss('cancel');
  }
}
