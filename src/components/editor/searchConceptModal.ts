import Dataset = Twitter.Typeahead.Dataset;
import Templates = Twitter.Typeahead.Templates;
import IScope = angular.IScope;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import gettextCatalog = angular.gettext.gettextCatalog;
import { ConceptService } from '../../services/conceptService';
import { LanguageService } from '../../services/languageService';
import { Reference, Concept, ConceptSuggestion, Type, Uri } from '../../services/entities';
import { AddConceptModal, ConceptSuggestionCreation } from './addConceptModal';
const Bloodhound = require('typeahead.js/dist/bloodhound.js');

const limit = 1000;

export type ConceptCreation = {concept: Concept|ConceptSuggestion, label: string, type?: Type};

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
      backdrop: false,
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
  vocabularyId: string;

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

    $scope.$watch(() => this.concept, (concept) => {
      this.label = concept ? languageService.translate(concept.label) : '';
    });

    $scope.$watch(() => this.vocabularyId, vocabularyId => {
      const searchReferences = vocabularyId ? [_.findWhere(references, {vocabularyId})] : references;
      this.datasets = _.flatten(_.map(searchReferences, reference => {
        const conceptSuggestionDataset = new ConceptSuggestionDataset(reference, languageService, conceptService, gettextCatalog);
        return [conceptSuggestionDataset, new ConceptDataset(reference, languageService, conceptSuggestionDataset, gettextCatalog)];
      }));
    });
  }

  create() {
    this.$uibModalInstance.close(this.newCreation ? {concept: this.concept, label: this.label} : this.concept);
  };

  cancel() {
    this.$uibModalInstance.dismiss();
  };

  addConcept(conceptLabel: string, referenceId: Uri) {
    this.addConceptModal.open(this.defineConceptTitle, conceptLabel, _.findWhere(this.references, {id: referenceId}))
      .then((result: ConceptSuggestionCreation) => this.$q.all(
        {
          label: this.$q.when(result.label),
          concept: this.conceptService.createConceptSuggestion(Object.assign(result.concept, {lang: this.languageService.modelLanguage}))
            .then(conceptId => this.conceptService.getConceptSuggestion(conceptId))
        }))
      .then((result: ConceptCreation) => {
        this.$uibModalInstance.close(this.newCreation ? result : result.concept);
      });
  };

  mapSelection = (selection: ConceptSuggestion | ConceptSearchResult): IPromise<ConceptSuggestion | Concept> => {

    function isConceptSearchResult(obj: any): obj is ConceptSearchResult {
      return obj.uri;
    }

    if (!selection) {
      return null;
    } else if (selection instanceof ConceptSuggestion) {
      return this.$q.when(selection);
    } else if (isConceptSearchResult(selection)) {
      return this.conceptService.getConcept(selection.uri);
    }
  }
}


interface ConceptSearchResult {
  prefLabel: string;
  uri: string;
}

function createEngine(vocId: string, languageService: LanguageService): Bloodhound<ConceptSearchResult> {

  const estimatedDuplicateCount = 2;

  function identify(obj: any) {
    return obj.uri;
  }

  function limitResults<T>(results: T[]): T[] {
    return results.splice(0, Math.min(limit * estimatedDuplicateCount, results.length));
  }

  const engine: Bloodhound<ConceptSearchResult> = new Bloodhound({
    identify: identify,
    remote: {
      cache: false,
      url: `/api/rest/conceptSearch?term=%QUERY&lang=${languageService.modelLanguage}&vocid=${vocId}`,
      wildcard: '%QUERY',
      transform: (response: any) => _.uniq(limitResults(response.results), identify)
    },
    rateLimitBy: 'debounce',
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    datumTokenizer: Bloodhound.tokenizers.whitespace
  });

  engine.clear();
  engine.clearPrefetchCache();
  engine.clearRemoteCache();
  engine.initialize(true);

  return engine;
}

class ConceptSuggestionDataset implements Dataset {

  private suggestions: ConceptSuggestion[];

  name: string;
  limit: number = limit;
  templates: Templates;

  constructor(reference: Reference, private languageService: LanguageService, conceptService: ConceptService, gettextCatalog: gettextCatalog) {
    conceptService.getConceptSuggestions(reference.id)
      .then(suggestions => this.suggestions = suggestions);

    this.name = reference.vocabularyId;

    const header = `<h5>${this.languageService.translate(reference.label)}</h5>`

    this.templates = {
      header: header,
      empty: header,
      suggestion(data) {
        return `
          <div>
            ${languageService.translate(data.label)} (${gettextCatalog.getString('suggestion')})
            <p class="details">${data.schemeId}</p>
          </div>
          `
      }
    };
  }

  suggestionsContain(query: string): boolean {
    return !!_.find(this.suggestions, suggestion => this.suggestionContains(suggestion, query));
  }

  display(suggestion: ConceptSuggestion): string {
    return this.languageService.translate(suggestion.label);
  }

  // needs to be lambda wrapping this properly for typeahead lib
  source = (query: string, syncResults: any) => {
    return syncResults(this.matchingSuggestions(query));
  };

  private suggestionContains(suggestion: ConceptSuggestion, query: string): boolean {
    return this.languageService.translate(suggestion.label).toLowerCase().includes(query.toLowerCase());
  }

  private matchingSuggestions(query: string): ConceptSuggestion[] {
    return _.filter(this.suggestions, suggestion => this.suggestionContains(suggestion, query));
  }
}

class ConceptDataset implements Dataset {
  name: string;
  display: string;
  limit: number = limit;
  templates: Templates;

  constructor(private reference: Reference, private languageService: LanguageService, conceptSuggestionDataset: ConceptSuggestionDataset, gettextCatalog: gettextCatalog) {
    this.display = 'prefLabel';
    this.name = reference.vocabularyId;
    this.templates = {
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
    }
  }

  source: any = createEngine(this.reference.vocabularyId, this.languageService);
}
