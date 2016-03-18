import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import {
  EntityDeserializer, ConceptSuggestion, FintoConcept, GraphData, FintoConceptSearchResult,
  Reference, Localizable
} from './entities';
import { Language } from './languageService';
import { upperCaseFirst } from 'change-case';
import { config } from '../config';
import { Uri } from './uri';

export interface ConceptSearchResult {
  id: Uri;
  label: Localizable;
  suggestion: boolean;
  reference: Reference;
}

export class ConceptService {
  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getAllSchemes(lang: Language): IHttpPromise<any> {
    return this.$http.get(config.apiEndpointWithName('scheme'), {params: {lang}});
  }

  searchConcepts(reference: Reference, language: Language, searchText: string): IPromise<ConceptSearchResult[]>[] {

    function mapResult(result: FintoConceptSearchResult|ConceptSuggestion) {
      return {
        id: result.id,
        label: result.label,
        suggestion: result instanceof ConceptSuggestion,
        reference: reference
      }
    }

    const conceptSuggestions = this.searchConceptSuggestions(searchText, language, reference.id)
      .then(suggestions => _.map(suggestions, mapResult));

    const result = [conceptSuggestions];

    if (!reference.isLocal()) {
      const concepts = this.searchFintoConcepts(searchText, language, reference.vocabularyId)
        .then(suggestions => _.map(suggestions, mapResult));

      result.push(concepts);
    }

    return result;
}

  private searchFintoConcepts(query: string, lang: Language, vocabularyId: string): IPromise<FintoConceptSearchResult[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('conceptSearch'), {params: {term: query, lang, vocid: vocabularyId}})
      .then(response => this.entities.deserializeFintoConceptSearchResults(response.data));
  }

  private searchConceptSuggestions(query: string, lang: Language, schemeId: Uri): IPromise<ConceptSuggestion[]> {
    function suggestionContains(suggestion: ConceptSuggestion, query: string): boolean {
      const localization = suggestion.label[lang] || '';
      return localization.toLowerCase().includes(query.toLowerCase());
    }

    function matchingSuggestions(suggestions: ConceptSuggestion[], query: string): ConceptSuggestion[] {
      return _.filter(suggestions, suggestion => suggestionContains(suggestion, query));
    }

    return this.getConceptSuggestions(schemeId).then(suggestions => matchingSuggestions(suggestions, query));
  }

  getConceptSuggestion(id: Uri): IPromise<ConceptSuggestion> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('conceptSuggestion'), {params: {conceptID: id.uri}})
      .then(response => this.entities.deserializeConceptSuggestion(response.data));
  }

  getConceptSuggestions(schemeId: Uri): IPromise<ConceptSuggestion[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('conceptSuggestion'), {params: {schemeID: schemeId.uri}})
      .then(response => this.entities.deserializeConceptSuggestions(response.data));
  }

  createConceptSuggestion(schemeId: Uri, label: string, comment: string, broaderConceptId: Uri, lang: Language): IPromise<Uri> {
    return this.$http.put(config.apiEndpointWithName('conceptSuggestion'), null, {
      params: {
        schemeID: schemeId.uri,
        label: upperCaseFirst(label),
        comment,
        lang,
        topConceptID: broaderConceptId && broaderConceptId.uri
      }})
      .then((response: any) => new Uri(response.data['@id']));
  }

  getFintoConcept(id: Uri): IPromise<FintoConcept> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('concept'), {params: {uri: id.uri}})
      .then(response => this.entities.deserializeFintoConcept(response.data, id.uri));
  }
}
