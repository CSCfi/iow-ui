import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import { Activity, Uri, EntityDeserializer } from './entities';

export class VersionService {

  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getVersion(id: Uri): IPromise<Activity> {
    return this.$http.get('/api/rest/version', {params: {id}})
      .then(response => this.entities.deserializeVersion(response.data));
  }
}
