import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import { config } from '../config';

export class ResetService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  reset(): IPromise<any> {
    return this.$http.get(config.apiEndpointWithName('reset'));
  }
}
