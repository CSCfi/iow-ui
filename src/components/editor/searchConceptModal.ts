import Dataset = Twitter.Typeahead.Dataset;
import Templates = Twitter.Typeahead.Templates;
import IScope = angular.IScope;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import gettextCatalog = angular.gettext.gettextCatalog;
import { ConceptService, ConceptSuggestionDataset } from '../../services/conceptService';
import { LanguageService } from '../../services/languageService';
import { Reference, Concept, ConceptSuggestion, Type, Uri } from '../../services/entities';
import { AddConceptModal, ConceptSuggestionCreation } from './addConceptModal';

const limit = 1000;

export type ConceptCreation = {concept: Concept|ConceptSuggestion, label: string, type: Type};

export function isConceptCreation(obj: any): obj is ConceptCreation {
  return obj.concept;
}

export class SearchConceptModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(references: Reference[], type: Type, newCreation: boolean) {
    return this.$uibModal.open({
      template: require('./searchConceptModal.html'),
      size: 'small',
      controller: SearchConceptController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        references: () => references,
        type: () => type,
        newCreation: () => newCreation
      }
    }).result;
  }

  openSelection(references: Reference[], type: Type): IPromise<Concept|ConceptSuggestion> {
    return this.open(references, type, false);
  }

  openNewCreation(references: Reference[], type: Type): IPromise<ConceptCreation> {
    return this.open(references, type, true);
  }
};


class SearchConceptController {

  datasets: Dataset[];
  concept: ConceptSuggestion | Concept;
  label: string;
  defineConceptTitle: string;
  buttonTitle: string;
  labelTitle: string;
  vocabularyId: string;
  selectedReference: Reference;
  mapSelection = this.conceptService.mapSelection.bind(this.conceptService);

  options = {
    hint: false,
    highlight: true,
    minLength: 3,
    editable: false
  };

  /* @ngInject */
  constructor(private $scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private $q: IQService,
              private languageService: LanguageService,
              private gettextCatalog: gettextCatalog,
              public type: Type,
              public newCreation: boolean,
              public references: Reference[],
              private addConceptModal: AddConceptModal,
              private conceptService: ConceptService) {

    this.defineConceptTitle = `Define concept for the ${this.newCreation ? 'new ' : ''}${this.type}`;
    this.buttonTitle = newCreation ? 'Create new' : 'Use';
    this.labelTitle = `${_.capitalize(this.type)} label`;

    $scope.$watch(() => this.vocabularyId, id => {
      this.selectedReference = _.find(references, reference => reference.vocabularyId === id);
    });

    $scope.$watch(() => this.concept, (concept) => {
      this.label = concept ? languageService.translate(concept.label) : '';
    });

    function createTemplates(reference: Reference, conceptSuggestionDataset: ConceptSuggestionDataset): Templates {
      return {
        empty: (search: {query: string}) => {
          if (!conceptSuggestionDataset.suggestionsContain(search.query)) {
            return `
              <div class="empty-message">
                '${search.query}' ${gettextCatalog.getString('not found in the concept database')}
                  <p>
                    <a onClick="angular.element(jQuery('#conceptForm').parents('[uib-modal-window]')).scope().ctrl.addConcept('${search.query}', '${reference.id}')">
                      + ${gettextCatalog.getString('suggest')} '${search.query}' ${gettextCatalog.getString('and create new')}
                    </a>
                  </p>
              </div>`;
          }
        },
        suggestion: (data) =>
          `
          <div>
            ${data.prefLabel}
            <p class="details">${data.uri}</p>
          </div>
          `
      };
    }

    $scope.$watch(() => this.vocabularyId, vocabularyId => {
      const searchReferences = vocabularyId ? [_.findWhere(references, {vocabularyId})] : references;
      this.datasets = _.flatten(_.map(searchReferences, reference => {
        const conceptSuggestionDataset = conceptService.createConceptSuggestionDataSet(reference, limit);
        return [conceptSuggestionDataset, conceptService.createConceptDataSet(reference, limit, createTemplates(reference, conceptSuggestionDataset))];
      }));
    });
  }

  create() {
    this.$uibModalInstance.close(this.newCreation ? {type: this.type, concept: this.concept, label: this.label} : this.concept);
  };

  cancel() {
    this.$uibModalInstance.dismiss();
  };

  addConcept(conceptLabel: string, referenceId: Uri) {
    this.addConceptModal.open(this.labelTitle, this.defineConceptTitle, conceptLabel, _.findWhere(this.references, {id: referenceId}))
      .then((result: ConceptSuggestionCreation) => this.$q.all(
        {
          type: this.$q.when(this.type),
          label: this.$q.when(result.label),
          concept: this.conceptService.createConceptSuggestion(result.concept.schemeId, result.concept.label, result.concept.comment, result.concept.broaderConceptId, this.languageService.modelLanguage)
            .then(conceptId => this.conceptService.getConceptSuggestion(conceptId))
        }))
      .then((result: ConceptCreation) => {
        this.$uibModalInstance.close(this.newCreation ? result : result.concept);
      });
  };
}


