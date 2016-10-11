import { IHttpService, IPromise } from 'angular';
import * as _  from 'lodash';
import { config } from '../config';
import { Uri } from '../entities/uri';
import { normalizeAsArray } from '../utils/array';
import { FrameService } from './frameService';
import * as frames from '../entities/frames';
import { GraphData } from '../entities/contract';
import { GroupListItem, Group } from '../entities/group';

export class GroupService {

  /* @ngInject */
  constructor(private $http: IHttpService, private frameService: FrameService) {
  }

  getAllGroups(): IPromise<GroupListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('groups'))
      .then(response => this.deserializeGroupList(response.data!));
  }

  getGroup(groupId: Uri): IPromise<Group> {
    // TODO proper API
    return this.$http.get<GraphData>(config.apiEndpointWithName('groups'))
      .then((response: any) => {
        const context = response.data['@context'];
        return {
          '@context': context,
          '@graph': _.find(normalizeAsArray(response.data!['@graph']), (group: any) => new Uri(group['@id'], context).equals(groupId))
        };
      })
      .then(data => this.deserializeGroup(data));
  }

  private deserializeGroupList(data: GraphData): IPromise<GroupListItem[]> {
    return this.frameService.frameAndMapArray(data, frames.groupListFrame(data), () => GroupListItem);
  }

  private deserializeGroup(data: GraphData): IPromise<Group> {
    return this.frameService.frameAndMap(data, true, frames.groupFrame(data), () => Group);
  }
}
