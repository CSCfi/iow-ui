import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import { Uri } from './uri';
import { pascalCase, camelCase } from 'change-case';
import { config } from '../config';

export class ValidatorService {
  /* @ngInject */
  constructor(private $q: IQService, private $http: IHttpService) {
  }

  classDoesNotExist(id: Uri): IPromise<any> {
    const pascalId = id.withName(pascalCase(id.name));
    return this.$http.get(config.apiEndpointWithName('class'), {params: {id: pascalId.uri}}).then(result => this.$q.reject('exists'), err => true);
  }

  predicateDoesNotExist(id: Uri): IPromise<any> {
    const camelId = id.withName(camelCase(id.name));
    return this.$http.get(config.apiEndpointWithName('predicate'), {params: {id: camelId.uri}}).then(result => this.$q.reject('exists'), err => true);
  }
}
