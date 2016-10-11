import { IPromise, IHttpService } from 'angular';
import { config } from '../config';
import { Language } from '../utils/language';
import { GraphData } from '../entities/contract';
import { FrameService } from './frameService';
import { searchResultFrame } from '../entities/frames';
import { SearchResult } from '../entities/search';

export class SearchService {

  /* @ngInject */
  constructor(private $http: IHttpService, private frameService: FrameService) {
  }

  search(graph: string, search: string, language?: Language): IPromise<SearchResult[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('search'), {params: {graph, search, lang: language}})
      .then(response => this.deserializeSearch(response.data!));
  }

  searchAnything(search: string, language?: Language): IPromise<SearchResult[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('search'), {
        params: {
          graph: 'default',
          search,
          lang: language
        }
      })
      .then(response => this.deserializeSearch(response.data!));
  }

  private deserializeSearch(data: GraphData): IPromise<SearchResult[]> {
    return this.frameService.frameAndMapArray(data, searchResultFrame(data), () => SearchResult);
  }
}
