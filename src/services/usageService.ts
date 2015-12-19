import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import { EntityDeserializer, Usage, Uri } from './entities';

export class UsageService {
  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getUsage(id: Uri): IPromise<Usage> {
    return this.$http.get('/api/rest/usage', {params: {id}})
      .then(response => this.entities.deserializeUsage(response.data));
  }
}
