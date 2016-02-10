import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import { Activity, Uri, EntityDeserializer } from './entities';

export class HistoryService {

  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getHistory(id: Uri): IPromise<Activity> {
    return this.$http.get('/api/rest/history', {params: {id}})
      .then(response => this.entities.deserializeVersion(response.data));
  }
}
