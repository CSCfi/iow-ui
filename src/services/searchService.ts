import IPromise = angular.IPromise;
import IHttpService = angular.IHttpService;
import { EntityDeserializer, SearchResult, GraphData } from './entities';
import { config } from '../config';
import { Language } from '../utils/language';

export class SearchService {

  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  search(graph: string, search: string, language?: Language): IPromise<SearchResult[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('search'), {params: {graph, search, lang: language}})
      .then(response => this.entities.deserializeSearch(response.data));
  }

  searchAnything(search: string, language?: Language): IPromise<SearchResult[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('search'), {
        params: {
          graph: 'default',
          search,
          lang: language
        }
      })
      .then(response => this.entities.deserializeSearch(response.data));
  }
}
