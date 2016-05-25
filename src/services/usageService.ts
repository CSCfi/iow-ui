import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import { EntityDeserializer, Usage, EditableEntity, GraphData } from './entities';
import { config } from '../config';

export class UsageService {
  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getUsage(entity: EditableEntity): IPromise<Usage> {
    const params = entity.isOfType('model')   ? { model:   entity.id.uri }
                 : entity.isOfType('concept') ? { concept: entity.id.uri }
                                              : { id:      entity.id.uri };

    return this.$http.get<GraphData>(config.apiEndpointWithName('usage'), {params})
      .then(response => this.entities.deserializeUsage(response.data));
  }
}
