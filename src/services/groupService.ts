import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import * as _  from 'lodash';
import { normalizeAsArray } from './utils';
import { EntityDeserializer, Group, GroupListItem, Uri } from './entities';

export class GroupService {

  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getAllGroups(): IPromise<GroupListItem[]> {
    return this.$http.get('/api/rest/groups')
      .then(response => this.entities.deserializeGroupList(response.data));
  }

  getGroup(groupId: Uri): IPromise<Group> {
    // TODO proper API
    return this.$http.get('/api/rest/groups')
      .then((response: any) => {
        return {
          '@context': response.data['@context'],
          '@graph': _.find(normalizeAsArray(response.data['@graph']), (group: any) => group['@id'] === groupId)
        };
      })
      .then(data => this.entities.deserializeGroup(data))
  }
}
