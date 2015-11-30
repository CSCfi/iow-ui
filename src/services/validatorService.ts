import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import { Uri } from './entities';

export class ValidatorService {
  /* @ngInject */
  constructor(private $q: IQService, private $http: IHttpService) {
  }

  idDoesNotExist(id: Uri): IPromise<any> {
    return this.$q.all([this.$http.get('/api/rest/class', {params: {id}}), this.$http.get('/api/rest/predicate', {params: {id}})])
    .then(results => {
      return this.$q.reject('exist');
    }, err => true);
  }
}
