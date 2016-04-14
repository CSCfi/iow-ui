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

  classDoesNotExist(id: Uri): IPromise<boolean> {
    return this.idDoesNotExist(id.withName(pascalCase(id.name)));
  }

  predicateDoesNotExist(id: Uri): IPromise<boolean> {
    return this.idDoesNotExist(id.withName(camelCase(id.name)));
  }

  private idDoesNotExist(id: Uri): IPromise<boolean> {
    return this.$http.get(config.apiEndpointWithName('freeID'), {params: {id: id.uri}})
      .then(result => result.data ? true : this.$q.reject('exists'), err => true);
  }
}
