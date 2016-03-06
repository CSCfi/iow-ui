import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import { Activity, Uri, EntityDeserializer, GraphData } from './entities';
import { config } from '../config';

export class HistoryService {

  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getHistory(id: Uri): IPromise<Activity> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('history'), {params: {id: id.uri}})
      .then(response => this.entities.deserializeVersion(response.data));
  }
}
