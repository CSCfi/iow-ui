import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import * as _  from 'lodash';
import { EntityDeserializer, Group, GroupListItem, GraphData } from './entities';
import { config } from '../config';
import { Uri } from './uri';
import { normalizeAsArray } from '../utils/array';

export class GroupService {

  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getAllGroups(): IPromise<GroupListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('groups'))
      .then(response => this.entities.deserializeGroupList(response.data));
  }

  getGroup(groupId: Uri): IPromise<Group> {
    // TODO proper API
    return this.$http.get<GraphData>(config.apiEndpointWithName('groups'))
      .then((response: any) => {
        const context = response.data['@context'];
        return {
          '@context': context,
          '@graph': _.find(normalizeAsArray(response.data['@graph']), (group: any) => new Uri(group['@id'], context).equals(groupId))
        };
      })
      .then(data => this.entities.deserializeGroup(data));
  }
}
