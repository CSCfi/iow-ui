import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _  from 'lodash';
import { EntityDeserializer, Predicate, PredicateListItem, Uri, Model, Type } from './entities';
import { Language } from './languageService';

export class PredicateService {
  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getPredicate(id: Uri): IPromise<Predicate> {
    return this.$http.get('/api/rest/predicate', {params: {id}}).then(response => this.entities.deserializePredicate(response.data));
  }

  getAllPredicates(): IPromise<PredicateListItem[]> {
    return this.$http.get('/api/rest/predicate').then(response => this.entities.deserializePredicateList(response.data));
  }

  getPredicatesForModel(modelId: Uri): IPromise<PredicateListItem[]> {
    return this.$http.get('/api/rest/predicate', {params: {model: modelId}}).then(response => this.entities.deserializePredicateList(response.data));
  }

  createPredicate(predicate: Predicate): IPromise<boolean> {
    const requestParams = {
      id: predicate.id,
      model: predicate.modelId
    };
    return this.$http.put('/api/rest/predicate', predicate.serialize(), {params: requestParams})
      .then(() => predicate.unsaved = false);
  }

  updatePredicate(predicate: Predicate, originalId: Uri): IHttpPromise<any> {
    const requestParams: any = {
      id: predicate.id,
      model: predicate.modelId
    };
    if (requestParams.id !== originalId) {
      requestParams.oldid = originalId;
    }
    return this.$http.post('/api/rest/predicate', predicate.serialize(), {params: requestParams});
  }

  deletePredicate(id: Uri, modelId: Uri): IHttpPromise<any> {
    const requestParams = {
      id,
      model: modelId
    };
    return this.$http.delete('/api/rest/predicate', {params: requestParams});
  }

  assignPredicateToModel(predicateId: Uri, modelId: Uri): IHttpPromise<any> {
    const requestParams = {
      id: predicateId,
      model: modelId
    };
    return this.$http.post('/api/rest/predicate', undefined, {params: requestParams});
  }

  newPredicate(model: Model, predicateLabel: string, conceptID: Uri, type: Type, lang: Language): IPromise<Predicate> {
    return this.$http.get('/api/rest/predicateCreator', {params: {modelID: model.id, predicateLabel, conceptID, type, lang}})
      .then((response: any) => {
        _.extend(response.data['@context'], model.context);
        return response;
      })
      .then(response => this.entities.deserializePredicate(response.data))
      .then((predicate: Predicate) => {
        predicate.unsaved = true;
        return predicate;
      });
  }
}
