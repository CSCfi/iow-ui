import { IHttpService, IPromise } from 'angular';
import { config } from '../config';
import { Uri } from '../entities/uri';
import { GraphData } from '../entities/contract';
import { FrameService } from './frameService';
import * as frames from '../entities/frames';
import { Activity } from '../entities/version';

export class HistoryService {

  /* @ngInject */
  constructor(private $http: IHttpService, private frameService: FrameService) {
  }

  getHistory(id: Uri): IPromise<Activity> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('history'), {params: {id: id.uri}})
      .then(response => this.deserializeVersion(response.data!));
  }

  private deserializeVersion(data: GraphData): IPromise<Activity> {
    return this.frameService.frameAndMap(data, true, frames.versionFrame(data), () => Activity);
  }
}
