import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import { EntityDeserializer, Concept, ConceptSuggestion, Uri } from './entities';
import { Language } from './languageService';

export class ConceptService {
  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private entities: EntityDeserializer) {
  }

  getAllSchemes(lang: Language): IHttpPromise<any> {
    return this.$http.get('/api/rest/scheme', {params: {lang}});
  }

  getConceptSuggestion(id: Uri): IPromise<ConceptSuggestion> {
    return this.$http.get('/api/rest/conceptSuggestion', {params: {conceptID: id}})
      .then(response => this.entities.deserializeConceptSuggestion(response.data));
  }

  getConceptSuggestions(schemeId: Uri): IPromise<ConceptSuggestion[]> {
    return this.$http.get('/api/rest/conceptSuggestion', {params: {schemeID: schemeId}})
      .then(response => this.entities.deserializeConceptSuggestions(response.data));
  }

  createConceptSuggestion({schemeId, label, comment, lang}): IPromise<string> {
    return this.$http.put('/api/rest/conceptSuggestion', null, {params: {schemeID: schemeId, label, comment, lang}})
      .then((response: any) => response.data['@id']);
  }

  getConcept(id: Uri): IPromise<Concept> {
    return this.$http.get('/api/rest/concept', {params: {uri: id}})
      .then(response => this.entities.deserializeConcept(response.data, id));
  }
}
