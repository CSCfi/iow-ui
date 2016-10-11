import { IHttpPromise, IHttpService, IPromise, IQService } from 'angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { config } from '../config';
import { upperCaseFirst } from 'change-case';
import { Uri, Urn } from './uri';
import { Language } from '../utils/language';
import { expandContextWithKnownModels, collectIds } from '../utils/entity';
import { normalizeAsArray, index } from '../utils/array';
import { requireDefined, assertNever } from '../utils/object';
import * as frames from '../entities/frames';
import { FrameService } from './frameService';
import { GraphData } from '../entities/contract';
import { KnownModelType } from '../entities/type';
import { ModelPositions, VisualizationClass, DefaultVisualizationClass } from '../entities/visualization';
import { ReferenceDataCode, ReferenceData, ReferenceDataServer } from '../entities/referenceData';
import { Model, ModelListItem, ImportedNamespace, Link } from '../entities/model';

export class ClassVisualization {

  private classIndex: Map<string, VisualizationClass>;

  constructor(public classes: VisualizationClass[], public positions: ModelPositions) {
    this.classIndex = index(classes, klass => klass.id.toString());
  }

  getClassById(classId: string) {
    return requireDefined(this.classIndex.get(classId));
  }

  getClassIds() {
    return collectIds(this.classes);
  }

  getClassIdsWithoutPosition() {
    return this.classes.filter(c => !this.positions.isClassDefined(c.id)).map(c => c.id);
  }

  addPositionChangeListener(listener: () => void) {
    this.positions.addChangeListener(listener);
  }
}

export class ModelService {

  // indexed by reference data id
  private referenceDataCodesCache = new Map<string, IPromise<ReferenceDataCode[]>>();

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private frameService: FrameService) {
  }

  getModelsByGroup(groupUrn: Uri): IPromise<ModelListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('model'), { params: { group: groupUrn.uri } })
      .then(response => this.deserializeModelList(response.data!));
  }

  getModelByUrn(urn: Uri|Urn): IPromise<Model> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('model'), { params: { id: urn.toString() } })
      .then(response => this.deserializeModelById(response.data!, urn));
  }

  getModelByPrefix(prefix: string): IPromise<Model> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('model'), { params: { prefix } })
      .then(response => this.deserializeModelByPrefix(response.data!, prefix));
  }

  createModel(model: Model): IPromise<any> {
    return this.$http.put<{ identifier: Urn }>(config.apiEndpointWithName('model'), model.serialize(), { params: { id: model.id.uri, group: model.group.id.uri } })
      .then(response => {
        model.unsaved = false;
        model.version = response.data!.identifier;
        model.createdAt = moment();
      });
  }

  updateModel(model: Model): IPromise<any> {
    return this.$http.post<{ identifier: Urn }>(config.apiEndpointWithName('model'), model.serialize(), { params: { id: model.id.uri } })
      .then(response => {
        model.version = response.data!.identifier;
        model.modifiedAt = moment();
      });
  }

  deleteModel(id: Uri): IHttpPromise<any> {
    return this.$http.delete(config.apiEndpointWithName('model'), { params: { id: id.uri } });
  }

  newModel(prefix: string, label: string, groupId: Uri, lang: Language[], type: KnownModelType, redirect?: Uri): IPromise<Model> {
    function mapEndpoint() {
      switch (type) {
        case 'library':
          return 'modelCreator';
        case 'profile':
          return 'profileCreator';
        default:
          return assertNever(type, 'Unknown type: ' + type);
      }
    }
    return this.$http.get<GraphData>(config.apiEndpointWithName(mapEndpoint()), {
      params: {
        prefix,
        label: upperCaseFirst(label),
        lang: lang[0],
        langList: lang.join(' '),
        group: groupId.uri,
        redirect: redirect && redirect.uri
      }
    })
      .then(response => this.deserializeModel(response.data!))
      .then((model: Model) => {
        model.unsaved = true;
        return model;
      });
  }

  newLink(title: string, description: string, homepage: Uri, lang: Language, context: any) {
    const graph = {
      title: {
        [lang]: title
      },
      description: {
        [lang]: description
      },
      homepage: homepage.url
    };

    const frameObject = frames.modelFrame({ '@graph': graph, '@context': context});

    return this.$q.when(new Link(graph, context, frameObject));
  }

  getAllImportableNamespaces(): IPromise<ImportedNamespace[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('listNamespaces'))
      .then(response => this.deserializeImportedNamespaces(response.data!));
  }

  newNamespaceImport(namespace: string, prefix: string, label: string, lang: Language): IPromise<ImportedNamespace> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('modelRequirementCreator'), {params: {namespace, prefix, label, lang}})
      .then(response => this.deserializeImportedNamespace(response.data!));
  }

  getVisualization(model: Model) {
    return this.$q.all([this.getVisualizationClasses(model), this.getModelPositions(model)])
      .then(([classes, positions]) => new ClassVisualization(classes, positions));
  }

  getVisualizationClasses(model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('exportModel'), {
      params: {
        graph: model.id.uri,
        'content-type': 'application/ld+json'
      }
    })
    .then(expandContextWithKnownModels(model))
    .then(response => this.deserializeModelVisualization(response.data!));
  }

  getModelPositions(model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('modelPositions'), {
      params: {
        model: model.id.uri
      }
    })
    .then(expandContextWithKnownModels(model))
    .then(response => this.deserializeModelPositions(response.data!), () => this.newModelPositions(model));
  }

  updateModelPositions(model: Model, modelPositions: ModelPositions) {
    return this.$http.put(config.apiEndpointWithName('modelPositions'), modelPositions.serialize(), { params: { model: model.id.uri } });
  }

  newModelPositions(model: Model) {
    const frame: any = frames.modelPositionsFrame({ '@context': model.context });
    return new ModelPositions([], frame['@context'], frame);
  }

  getReferenceDataServers(): IPromise<ReferenceDataServer[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeServer'))
      .then(response => this.deserializeReferenceDataServers(response.data!));
  }

  getReferenceDatasForServer(server: ReferenceDataServer): IPromise<ReferenceData[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeList'), { params: { uri: server.id.uri } })
      .then(response => this.deserializeReferenceDatas(response.data!));
  }

  getReferenceDatasForServers(servers: ReferenceDataServer[]): IPromise<ReferenceData[]> {
    return this.$q.all(_.map(servers, server => this.getReferenceDatasForServer(server)))
      .then(referenceDatas => _.flatten(referenceDatas));
  }

  getAllReferenceDatas(): IPromise<ReferenceData[]> {
    return this.getReferenceDataServers().then(servers => this.getReferenceDatasForServers(servers));
  }

  getReferenceDataCodes(referenceData: ReferenceData|ReferenceData[]): IPromise<ReferenceDataCode[]> {

    const getSingle = (rd: ReferenceData) => {
      const cached = this.referenceDataCodesCache.get(rd.id.uri);

      if (cached) {
        return cached;
      } else {
        const result = this.$http.get<GraphData>(config.apiEndpointWithName('codeValues'), {params: {uri: rd.id.uri}})
          .then(response => this.deserializeReferenceDataCodes(response.data!));

        this.referenceDataCodesCache.set(rd.id.uri, result);
        return result;
      }
    };

    const internalReferenceData = _.filter(normalizeAsArray(referenceData), rd => !rd.isExternal());

    return this.$q.all(_.map(internalReferenceData, rd => getSingle(rd)))
        .then(referenceDatas => _.flatten(referenceDatas));
  }

  newReferenceData(uri: Uri, label: string, description: string, lang: Language): IPromise<ReferenceData> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeListCreator'), {params: {uri: uri.uri, label, description, lang}})
      .then(response => this.deserializeReferenceData(response.data!));
  }

  private deserializeModelList(data: GraphData): IPromise<ModelListItem[]> {
    return this.frameService.frameAndMapArray(data, frames.modelListFrame(data), () => ModelListItem);
  }

  private deserializeModel(data: GraphData): IPromise<Model> {
    return this.frameService.frameAndMap(data, true, frames.modelFrame(data), () => Model);
  }

  private deserializeModelById(data: GraphData, id: Uri|Urn): IPromise<Model> {
    return this.frameService.frameAndMap(data, true, frames.modelFrame(data, {id}), () => Model);
  }

  private deserializeModelByPrefix(data: GraphData, prefix: string): IPromise<Model> {
    return this.frameService.frameAndMap(data, true, frames.modelFrame(data, {prefix}), () => Model);
  }

  private deserializeImportedNamespace(data: GraphData): IPromise<ImportedNamespace> {
    return this.frameService.frameAndMap(data, true, frames.namespaceFrame(data), () => ImportedNamespace);
  }

  private deserializeImportedNamespaces(data: GraphData): IPromise<ImportedNamespace[]> {
    return this.frameService.frameAndMapArray(data, frames.namespaceFrame(data), () => ImportedNamespace);
  }

  private deserializeModelVisualization(data: GraphData): IPromise<VisualizationClass[]> {
    return this.frameService.frameAndMapArray(data, frames.classVisualizationFrame(data), () => DefaultVisualizationClass);
  }

  private deserializeModelPositions(data: GraphData): IPromise<ModelPositions> {
    return this.frameService.frameAndMapArrayEntity(data, frames.modelPositionsFrame(data), () => ModelPositions);
  }

  private deserializeReferenceDataServers(data: GraphData): IPromise<ReferenceDataServer[]> {
    return this.frameService.frameAndMapArray(data, frames.referenceDataServerFrame(data), () => ReferenceDataServer);
  }

  private deserializeReferenceData(data: GraphData): IPromise<ReferenceData> {
    return this.frameService.frameAndMap(data, true, frames.referenceDataFrame(data), () => ReferenceData);
  }

  private deserializeReferenceDatas(data: GraphData): IPromise<ReferenceData[]> {
    return this.frameService.frameAndMapArray(data, frames.referenceDataFrame(data), () => ReferenceData);
  }

  private deserializeReferenceDataCodes(data: GraphData): IPromise<ReferenceDataCode[]> {
    return this.frameService.frameAndMapArray(data, frames.referenceDataCodeFrame(data), () => ReferenceDataCode);
  }
}
