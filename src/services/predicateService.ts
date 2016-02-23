import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import { EntityDeserializer, Predicate, PredicateListItem, Model, Type, Attribute, Urn, Uri } from './entities';
import { Language } from './languageService';
import { upperCaseFirst } from 'change-case';
import { config } from '../config';
import { reverseMapType } from './typeMapping';

export class PredicateService {
  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getPredicate(id: Uri|Urn): IPromise<Predicate> {
    return this.$http.get(config.apiEndpointWithName('predicate'), {params: {id: id.toString()}}).then(response => this.entities.deserializePredicate(response.data));
  }

  getAllPredicates(): IPromise<PredicateListItem[]> {
    return this.$http.get(config.apiEndpointWithName('predicate')).then(response => this.entities.deserializePredicateList(response.data));
  }

  getPredicatesForModel(modelId: Uri): IPromise<PredicateListItem[]> {
    return this.$http.get(config.apiEndpointWithName('predicate'), {params: {model: modelId.uri}}).then(response => this.entities.deserializePredicateList(response.data));
  }

  createPredicate(predicate: Predicate): IPromise<any> {
    const requestParams = {
      id: predicate.id.uri,
      model: predicate.definedBy.id.uri
    };
    return this.$http.put<{ identifier: Urn }>(config.apiEndpointWithName('predicate'), predicate.serialize(), {params: requestParams})
      .then(response => {
        predicate.unsaved = false;
        predicate.version = response.data.identifier;
      });
  }

  updatePredicate(predicate: Predicate, originalId: Uri): IPromise<any> {
    const requestParams: any = {
      id: predicate.id.uri,
      model: predicate.definedBy.id.uri
    };
    if (predicate.id.notEquals(originalId)) {
      requestParams.oldid = originalId.uri;
    }
    return this.$http.post<{ identifier: Urn }>(config.apiEndpointWithName('predicate'), predicate.serialize(), {params: requestParams})
      .then(response => {
        predicate.version = response.data.identifier;
      });
  }

  deletePredicate(id: Uri, modelId: Uri): IHttpPromise<any> {
    const requestParams = {
      id: id.uri,
      model: modelId.uri
    };
    return this.$http.delete(config.apiEndpointWithName('predicate'), {params: requestParams});
  }

  assignPredicateToModel(predicateId: Uri, modelId: Uri): IHttpPromise<any> {
    const requestParams = {
      id: predicateId.uri,
      model: modelId.uri
    };
    return this.$http.post(config.apiEndpointWithName('predicate'), undefined, {params: requestParams});
  }

  newPredicate<T extends Predicate>(model: Model, predicateLabel: string, conceptID: Uri, type: Type, lang: Language): IPromise<T> {
    return this.$http.get(config.apiEndpointWithName('predicateCreator'), {
      params: {
        modelID: model.id.uri,
        predicateLabel: upperCaseFirst(predicateLabel),
        conceptID: conceptID.uri,
        type: reverseMapType(type), lang
      }})
      .then((response: any) => {
        _.extend(response.data['@context'], model.context);
        return response;
      })
      .then(response => this.entities.deserializePredicate(response.data))
      .then((predicate: Predicate) => {
        if (predicate instanceof Attribute && !predicate.dataType) {
          predicate.dataType = 'xsd:string';
        }
        predicate.unsaved = true;
        return predicate;
      });
  }
}
