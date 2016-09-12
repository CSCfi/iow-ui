import { IHttpService, IPromise } from 'angular';
import { config } from '../config';

export class ResetService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  reset(): IPromise<any> {
    return this.$http.get(config.apiEndpointWithName('reset'));
  }
}
