import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import { EntityDeserializer, ConceptSuggestion, Uri, FintoConcept } from './entities';
import { Language } from './languageService';
import { upperCaseFirst } from 'change-case';
import { config } from '../config';

export interface FintoConceptSearchResult {
  prefLabel: string;
  uri: string;
}

export class ConceptService {
  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private entities: EntityDeserializer) {
  }

  getAllSchemes(lang: Language): IHttpPromise<any> {
    return this.$http.get(config.apiEndpointWithName('scheme'), {params: {lang}});
  }

  getConceptSuggestion(id: Uri): IPromise<ConceptSuggestion> {
    return this.$http.get(config.apiEndpointWithName('conceptSuggestion'), {params: {conceptID: id}})
      .then(response => this.entities.deserializeConceptSuggestion(response.data));
  }

  getConceptSuggestions(schemeId: Uri): IPromise<ConceptSuggestion[]> {
    return this.$http.get(config.apiEndpointWithName('conceptSuggestion'), {params: {schemeID: schemeId}})
      .then(response => this.entities.deserializeConceptSuggestions(response.data));
  }

  createConceptSuggestion(schemeId: Uri, label: string, comment: string, broaderConceptId: Uri, lang: Language): IPromise<string> {
    return this.$http.put(config.apiEndpointWithName('conceptSuggestion'), null, {params: {schemeID: schemeId, label: upperCaseFirst(label), comment, lang, topConceptID: broaderConceptId}})
      .then((response: any) => response.data['@id']);
  }

  getFintoConcept(id: Uri): IPromise<FintoConcept> {
    return this.$http.get(config.apiEndpointWithName('concept'), {params: {uri: id}})
      .then(response => this.entities.deserializeFintoConcept(response.data, id));
  }
}
