import IPromise = angular.IPromise;
import Templates = Twitter.Typeahead.Templates;
import Dataset = Twitter.Typeahead.Dataset;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import { Reference, ConceptSuggestion, FintoConcept } from './entities';
import { ConceptService, FintoConceptSearchResult } from './conceptService';
import { LanguageService } from './languageService';
import { config } from '../config';

const Bloodhound = require('typeahead.js/dist/bloodhound.js');

export interface ConceptSuggestionDataset extends Dataset {
  suggestionsContain(query: string): boolean;
}

export class ConceptDatasets {

  /* @ngInject */
  constructor(private $q: IQService, private conceptService: ConceptService, private languageService: LanguageService, private gettextCatalog: gettextCatalog) {
  }

  createEngine(vocId: string, limit: number): Bloodhound<FintoConceptSearchResult> {

    function identify(obj: any) {
      return obj.uri;
    }

    function limitResults<T>(results: T[]): T[] {
      return results.splice(0, Math.min(limit, results.length));
    }

    const engine: Bloodhound<FintoConceptSearchResult> = new Bloodhound({
      identify: identify,
      remote: {
        cache: false,
        url: config.apiEndpointWithName(`conceptSearch?term=%QUERY&lang=${this.languageService.modelLanguage}&vocid=${vocId}`),
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

  mapSelection(selection: ConceptSuggestion | FintoConceptSearchResult): IPromise<ConceptSuggestion | FintoConcept> {

    function isFintoConceptSearchResult(obj: any): obj is FintoConceptSearchResult {
      return obj.uri;
    }

    if (!selection) {
      return this.$q.when(null);
    } else if (selection instanceof ConceptSuggestion) {
      return this.$q.when(selection);
    } else if (isFintoConceptSearchResult(selection)) {
      return this.conceptService.getFintoConcept(selection.uri);
    }
  }

  createConceptDataSet(reference: Reference, limit: number, templates?: Templates): Dataset {

    const defaultTemplates = {
      suggestion: (data: FintoConceptSearchResult) =>
        `
          <div>
            ${data.prefLabel}
            <p class="details">${data.uri}</p>
          </div>
          `
    };

    return {
      name: reference.vocabularyId,
      display: 'prefLabel',
      limit,
      templates: templates || defaultTemplates,
      source: <any> this.createEngine(reference.vocabularyId, limit)
    };
  }

  createConceptSuggestionDataSet(reference: Reference, limit: number): ConceptSuggestionDataset {

    const that = this;

    let suggestions: ConceptSuggestion[];
    this.conceptService.getConceptSuggestions(reference.id).then(s => suggestions = s);

    function suggestionContains(suggestion: ConceptSuggestion, query: string): boolean {
      return that.languageService.translate(suggestion.label).toLowerCase().includes(query.toLowerCase());
    }

    function suggestionsContain(query: string): boolean {
      return !!_.find(suggestions, suggestion => suggestionContains(suggestion, query));
    }

    function matchingSuggestions(query: string): ConceptSuggestion[] {
      return _.filter(suggestions, suggestion => suggestionContains(suggestion, query));
    }

    const header = `<h5>${this.languageService.translate(reference.label)}</h5>`;
    return {
      suggestionsContain,
      name: reference.vocabularyId,
      limit,
      templates: {
        header: header,
        empty: header,
        suggestion(data: ConceptSuggestion) {
          return `
          <div>
            ${that.languageService.translate(data.label)} (${that.gettextCatalog.getString('suggestion')})
            <p class="details">${data.inScheme}</p>
          </div>
          `
        },
      },
      display(suggestion: ConceptSuggestion) {
        return that.languageService.translate(suggestion.label);
      },
      source(query: string, syncResults: any) {
        return syncResults(matchingSuggestions(query));
      }
    }
  }
}
