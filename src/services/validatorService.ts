import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import { ExpandedCurie, Uri } from './entities';
import { pascalCase, camelCase } from 'change-case';

export class ValidatorService {
  /* @ngInject */
  constructor(private $q: IQService, private $http: IHttpService) {
  }

  classDoesNotExist(expanded: ExpandedCurie): IPromise<any> {
    const id = expanded.withValue(pascalCase(expanded.value)).uri;
    return this.$http.get('/api/rest/class', {params: {id}}).then(result => this.$q.reject('exists'), err => true);
  }

  predicateDoesNotExist(expanded: ExpandedCurie): IPromise<any> {
    const id = expanded.withValue(camelCase(expanded.value)).uri;
    return this.$http.get('/api/rest/predicate', {params: {id}}).then(result => this.$q.reject('exists'), err => true);
  }
}
