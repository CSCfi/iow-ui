import IPromise = angular.IPromise;
import IHttpService = angular.IHttpService;
import { EntityDeserializer, SearchResult } from './entities';
import { Language } from './languageService';
import { config } from '../config';

export class SearchService {

  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  search(graph: string, search: string, language: Language): IPromise<SearchResult[]> {
    return this.$http.get(config.apiEndpointWithName('search'), {params: {graph, search, lang: language}})
      .then(response => this.entities.deserializeSearch(response.data));
  }

  searchAnything(search: string, language: Language): IPromise<SearchResult[]> {
    return this.$http.get(config.apiEndpointWithName('search'), {
        params: {
          graph: 'default',
          search,
          lang: language
        }
      })
      .then(response => this.entities.deserializeSearch(response.data));
  }
}
