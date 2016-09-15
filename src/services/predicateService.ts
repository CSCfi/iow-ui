import { IHttpPromise, IHttpService, IPromise, IQService } from 'angular';
import * as moment from 'moment';
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

  private modelPredicatesCache = new Map<string, PredicateListItem[]>();

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private entities: EntityDeserializer) {
  }

  getPredicate(id: Uri|Urn, model?: Model): IPromise<Predicate> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('predicate'), {params: {id: id.toString()}})
      .then(expandContextWithKnownModels(model))
      .then(response => this.entities.deserializePredicate(response.data));
  }

  getAllPredicates(model: Model): IPromise<PredicateListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('predicate'))
      .then(expandContextWithKnownModels(model))
      .then(response => this.entities.deserializePredicateList(response.data));
  }

  getPredicatesForModel(model: Model) {
    return this.getAllPredicates(model)
      .then(predicates => predicates.filter(predicate => predicate.id.isCurieUrl()));  // if curie, it is known namespace
  }

  getPredicatesAssignedToModel(model: Model, invalidateCache: boolean = false): IPromise<PredicateListItem[]> {

    if (invalidateCache) {
      this.modelPredicatesCache.delete(model.id.uri);
    }

    const predicates = this.modelPredicatesCache.get(model.id.uri);

    if (predicates) {
      return this.$q.when(predicates);
    } else {
      return this.$http.get<GraphData>(config.apiEndpointWithName('predicate'), {params: {model: model.id.uri}})
        .then(expandContextWithKnownModels(model))
        .then(response => this.entities.deserializePredicateList(response.data))
        .then(predicateList => {
          this.modelPredicatesCache.set(model.id.uri, predicateList);
          return predicateList;
        });
    }
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

  newPredicate<T extends Attribute|Association>(model: Model, predicateLabel: string, conceptID: Uri, type: Type, lang: Language): IPromise<T> {
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

  changePredicateType(predicate: Attribute|Association, newType: Type, model: Model) {
    return this.newPredicate(model, '', predicate.subject.id, newType, 'fi')
      .then(changedPredicate => {
        changedPredicate.id = predicate.id;
        changedPredicate.label = predicate.label;
        changedPredicate.comment = predicate.comment;
        changedPredicate.createdAt = predicate.createdAt;
        changedPredicate.modifiedAt = predicate.modifiedAt;
        changedPredicate.editorialNote = predicate.editorialNote;
        changedPredicate.state = predicate.state;
        changedPredicate.unsaved = predicate.unsaved;
        return changedPredicate;
      });
  }

  getExternalPredicate(externalId: Uri, model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('externalPredicate'), {params: {model: model.id.uri, id: externalId.uri}})
      .then(expandContextWithKnownModels(model))
      .then(response => this.entities.deserializePredicate(response.data))
      .then(predicate => {
        if (predicate) {
          predicate.external = true;
        }
        return predicate;
      });
  }

  getExternalPredicatesForModel(model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('externalPredicate'), {params: {model: model.id.uri}})
      .then(expandContextWithKnownModels(model))
      .then(response => this.entities.deserializePredicateList(response.data));
  }
}
