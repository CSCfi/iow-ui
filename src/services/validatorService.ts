import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import { ExpandedCurie } from './entities';
import { pascalCase, camelCase } from 'change-case';
import { config } from '../config';

export class ValidatorService {
  /* @ngInject */
  constructor(private $q: IQService, private $http: IHttpService) {
  }

  classDoesNotExist(expanded: ExpandedCurie): IPromise<any> {
    const id = expanded.withValue(pascalCase(expanded.value)).uri;
    return this.$http.get(config.apiEndpointWithName('class'), {params: {id}}).then(result => this.$q.reject('exists'), err => true);
  }

  predicateDoesNotExist(expanded: ExpandedCurie): IPromise<any> {
    const id = expanded.withValue(camelCase(expanded.value)).uri;
    return this.$http.get(config.apiEndpointWithName('predicate'), {params: {id}}).then(result => this.$q.reject('exists'), err => true);
  }
}
