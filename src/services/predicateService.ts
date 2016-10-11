import { IHttpPromise, IHttpService, IPromise, IQService } from 'angular';
import * as moment from 'moment';
import { upperCaseFirst } from 'change-case';
import { config } from '../config';
import { reverseMapType, KnownPredicateType } from '../entities/type';
import { Urn, Uri } from './uri';
import { expandContextWithKnownModels } from '../utils/entity';
import { Language } from '../utils/language';
import { DataSource } from '../components/form/dataSource';
import { modelScopeCache } from '../components/form/cache';
import { requireDefined } from '../utils/object';
import { FrameService } from './frameService';
import { GraphData, EntityFactory } from '../entities/contract';
import * as frames from '../entities/frames';
import { containsAny } from '../utils/array';
import { PredicateListItem, Predicate, Attribute, Association } from '../entities/predicate';
import { Model } from '../entities/model';
import { typeSerializer } from '../entities/serializer/serializer';

export class PredicateService {

  private modelPredicatesCache = new Map<string, PredicateListItem[]>();

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private frameService: FrameService) {
  }

  getPredicate(id: Uri|Urn, model?: Model): IPromise<Predicate> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('predicate'), {params: {id: id.toString()}})
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializePredicate(response.data!));
  }

  getAllPredicates(model: Model): IPromise<PredicateListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('predicate'))
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializePredicateList(response.data!));
  }

  getPredicatesForModel(model: Model) {
    return this.getAllPredicates(model)
      .then(predicates => predicates.filter(predicate => predicate.id.isCurieUrl()));  // if curie, it is known namespace
  }

  getPredicatesForModelDataSource(modelProvider: () => Model): DataSource<PredicateListItem> {

    const cachedResultsProvider = modelScopeCache(modelProvider,  model => {
      return this.$q.all([
        this.getPredicatesForModel(model),
        this.getExternalPredicatesForModel(model)
      ]).then(_.flatten);
    });

    return () => cachedResultsProvider();
  }

  getPredicatesAssignedToModel(model: Model): IPromise<PredicateListItem[]> {

    const predicates = this.modelPredicatesCache.get(model.id.uri);

    if (predicates) {
      return this.$q.when(predicates);
    } else {
      return this.$http.get<GraphData>(config.apiEndpointWithName('predicate'), {params: {model: model.id.uri}})
        .then(expandContextWithKnownModels(model))
        .then(response => this.deserializePredicateList(response.data!))
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
        this.modelPredicatesCache.delete(predicate.definedBy.id.uri);
        predicate.unsaved = false;
        predicate.version = response.data!.identifier;
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
        predicate.version = response.data!.identifier;
        predicate.modifiedAt = moment();
      })
      .then(() => this.modelPredicatesCache.delete(predicate.definedBy.id.uri));
  }

  deletePredicate(id: Uri, modelId: Uri): IHttpPromise<any> {
    const requestParams = {
      id: id.uri,
      model: modelId.uri
    };
    return this.$http.delete(config.apiEndpointWithName('predicate'), {params: requestParams})
      .then(() => this.modelPredicatesCache.delete(modelId.uri));
  }

  assignPredicateToModel(predicateId: Uri, modelId: Uri): IHttpPromise<any> {
    const requestParams = {
      id: predicateId.uri,
      model: modelId.uri
    };
    return this.$http.post(config.apiEndpointWithName('predicate'), undefined, {params: requestParams})
      .then(() => this.modelPredicatesCache.delete(modelId.uri));
  }

  newPredicate<T extends Attribute|Association>(model: Model, predicateLabel: string, conceptID: Uri, type: KnownPredicateType, lang: Language): IPromise<T> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('predicateCreator'), {
      params: {
        modelID: model.id.uri,
        predicateLabel: upperCaseFirst(predicateLabel),
        conceptID: conceptID.uri,
        type: reverseMapType(type), lang
      }})
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializePredicate(response.data!))
      .then((predicate: Predicate) => {
        predicate.definedBy = model.asDefinedBy();
        if (predicate instanceof Attribute && !predicate.dataType) {
          predicate.dataType = 'xsd:string';
        }
        predicate.unsaved = true;
        return predicate;
      });
  }

  changePredicateType(predicate: Attribute|Association, newType: KnownPredicateType, model: Model) {
    return this.newPredicate(model, '', requireDefined(predicate.subject).id, newType, 'fi')
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

  copyPredicate(predicate: Predicate|Uri, type: 'attribute' | 'association', model: Model) {

    function newEmptyPredicate(): Attribute|Association {

      const graph = {
        '@id': id.uri,
        '@type': reverseMapType(type),
        versionInfo: 'Unstable',
        isDefinedBy: model.asDefinedBy().serialize(true)
      };

      const frameData = { '@graph': graph, '@context': model.context };
      const frame: any = frames.predicateFrame(frameData);

      const newPredicate = type === 'attribute' ? new Attribute(graph, frame['@context'], frame)
        : new Association(graph, frame['@context'], frame);

      newPredicate.unsaved = true;
      newPredicate.createdAt = moment();

      return newPredicate;
    }

    const oldId = predicate instanceof Uri ? predicate : predicate.id;
    const id = new Uri(model.namespace + oldId.name, model.context);
    const copied = newEmptyPredicate();

    if (predicate instanceof Predicate) {
      copied.label = predicate.label;
      copied.comment = predicate.comment;
      copied.subPropertyOf = predicate.subPropertyOf;
      copied.subject = predicate.subject;
      copied.equivalentProperties = predicate.equivalentProperties;
    }

    if (copied instanceof Association && predicate instanceof Association) {
      copied.valueClass = predicate.valueClass;
    }

    if (copied instanceof Attribute && predicate instanceof Attribute) {
      copied.dataType = predicate.dataType;
    }

    return this.$q.when(copied);
  }

  getExternalPredicate(externalId: Uri, model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('externalPredicate'), {params: {model: model.id.uri, id: externalId.uri}})
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializePredicate(response.data!))
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
      .then(response => this.deserializePredicateList(response.data!));
  }

  private deserializePredicateList(data: GraphData): IPromise<PredicateListItem[]> {
    return this.frameService.frameAndMapArray(data, frames.predicateListFrame(data), () => PredicateListItem);
  }

  private deserializePredicate(data: GraphData): IPromise<Attribute|Association|Predicate> {

    const entityFactory: EntityFactory<Predicate> = (framedData) => {
      const types = typeSerializer.deserialize(framedData['@graph'][0]['@type']);

      if (containsAny(types, ['association'])) {
        return Association;
      } else if (containsAny(types, ['attribute'])) {
        return Attribute;
      } else if (containsAny(types, ['property'])) {
        return Predicate;
      } else {
        throw new Error('Incompatible type: ' + types.join());
      }
    };

    return this.frameService.frameAndMap(data, true, frames.predicateFrame(data), entityFactory);
  }
}
