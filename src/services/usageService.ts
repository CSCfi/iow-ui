import { IHttpService, IPromise } from 'angular';
import {
  EntityDeserializer, Usage, GraphData, EmptyUsage, EditableEntity
} from './entities';
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
      .then(response => this.entities.deserializeUsage(response.data))
      .then(usage => {
        if (usage) {
          return usage;
        } else {
          return new EmptyUsage(entity);
        }
      });
  }
}
