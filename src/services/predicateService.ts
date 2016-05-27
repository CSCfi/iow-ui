import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as moment from 'moment';
import Moment = moment.Moment;
import {
  EntityDeserializer, Predicate, PredicateListItem, Model, Type, Attribute, GraphData, Association
} from './entities';
import { upperCaseFirst } from 'change-case';
import { config } from '../config';
import { reverseMapType } from './typeMapping';
import { Urn, Uri } from './uri';
import { expandContextWithKnownModels } from '../utils/entity';
import { Language } from '../utils/language';

export class PredicateService {
  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  getPredicate(id: Uri|Urn, model?: Model): IPromise<Predicate> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('predicate'), {params: {id: id.toString()}})
      .then(expandContextWithKnownModels(model))
      .then(response => this.entities.deserializePredicate(response.data));
  }

  getAllPredicates(): IPromise<PredicateListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('predicate')).then(response => this.entities.deserializePredicateList(response.data));
  }

  getPredicatesForModel(model: Model): IPromise<PredicateListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('predicate'), {params: {model: model.id.uri}})
      .then(expandContextWithKnownModels(model))
      .then(response => this.entities.deserializePredicateList(response.data));
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
        predicate.createdAt = moment();
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
        predicate.modifiedAt = moment();
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
    return this.$http.get<GraphData>(config.apiEndpointWithName('predicateCreator'), {
      params: {
        modelID: model.id.uri,
        predicateLabel: upperCaseFirst(predicateLabel),
        conceptID: conceptID.uri,
        type: reverseMapType(type), lang
      }})
      .then(expandContextWithKnownModels(model))
      .then(response => this.entities.deserializePredicate(response.data))
      .then((predicate: Predicate) => {
        predicate.definedBy = model.asDefinedBy();
        if (predicate instanceof Attribute && !predicate.dataType) {
          predicate.dataType = 'xsd:string';
        }
        predicate.unsaved = true;
        return predicate;
      });
  }

  newPredicateFromExternal(externalId: Uri, type: Type, model: Model) {
    return this.getExternalPredicate(externalId, model)
      .then(predicate => {
        if (!predicate) {
          const graph = {
            '@id': externalId.uri,
            '@type': reverseMapType(type),
            isDefinedBy: model.namespaceAsDefinedBy(externalId.namespace).serialize(true, false)
          };
          if (type === 'association') {
            return new Association(graph, model.context, model.frame);
          } else if (type === 'attribute') {
            return new Attribute(graph, model.context, model.frame);
          } else {
            throw new Error('Unsupported predicate type: ' + type);
          }
        } else {
          return predicate;
        }
      });
  }

  getExternalPredicate(externalId: Uri, model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('externalPredicate'), {params: {model: model.id.uri, id: externalId.uri}})
      .then(expandContextWithKnownModels(model))
      .then((response: any) => this.entities.deserializePredicate(response.data))
      .then(predicate => {
        if (predicate) {
          predicate.external = true;
        }
        return predicate;
      });
  }

  getExternalPredicatesForModel(model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('externalPredicate'), {params: {model: model.id.uri}}).then(response => this.entities.deserializePredicateList(response.data));
  }
}
