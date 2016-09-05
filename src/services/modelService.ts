import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import * as moment from 'moment';
import Moment = moment.Moment;
import { config } from '../config';
import {
  EntityDeserializer, Model, ModelListItem, ImportedNamespace, Type, GraphData, Link,
  ReferenceData, ReferenceDataServer, ReferenceDataCode, ModelPositions, VisualizationClass
} from './entities';
import { upperCaseFirst } from 'change-case';
import { modelFrame, modelPositionsFrame } from './frames';
import { Uri, Urn } from './uri';
import { Language } from '../utils/language';
import { expandContextWithKnownModels, collectIds } from '../utils/entity';
import { normalizeAsArray } from '../utils/array';

export class ClassVisualization {
  constructor(public classes: VisualizationClass[], public positions: ModelPositions) {
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
  private referenceDataCodesCache = new Map<string, ReferenceDataCode[]>();

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private entities: EntityDeserializer) {
  }

  getModelsByGroup(groupUrn: Uri): IPromise<ModelListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('model'), { params: { group: groupUrn.uri } })
      .then(response => this.entities.deserializeModelList(response.data));
  }

  getModelByUrn(urn: Uri|Urn): IPromise<Model> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('model'), { params: { id: urn.toString() } })
      .then(response => this.entities.deserializeModelById(response.data, urn));
  }

  getModelByPrefix(prefix: string): IPromise<Model> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('model'), { params: { prefix } })
      .then(response => this.entities.deserializeModelByPrefix(response.data, prefix));
  }

  createModel(model: Model): IPromise<any> {
    return this.$http.put<{ identifier: Urn }>(config.apiEndpointWithName('model'), model.serialize(), { params: { id: model.id.uri, group: model.group.id.uri } })
      .then(response => {
        model.unsaved = false;
        model.version = response.data.identifier;
        model.createdAt = moment();
      });
  }

  updateModel(model: Model): IPromise<any> {
    return this.$http.post<{ identifier: Urn }>(config.apiEndpointWithName('model'), model.serialize(), { params: { id: model.id.uri } })
      .then(response => {
        model.version = response.data.identifier;
        model.modifiedAt = moment();
      });
  }

  deleteModel(id: Uri): IHttpPromise<any> {
    return this.$http.delete(config.apiEndpointWithName('model'), { params: { id: id.uri } });
  }

  newModel(prefix: string, label: string, groupId: Uri, lang: Language[], type: Type): IPromise<Model> {
    function mapEndpoint() {
      switch (type) {
        case 'library':
          return 'modelCreator';
        case 'profile':
          return 'profileCreator';
        default:
          throw new Error("Unsupported type: " + type);
      }
    }
    return this.$http.get<GraphData>(config.apiEndpointWithName(mapEndpoint()), {
      params: {
        prefix,
        label: upperCaseFirst(label),
        lang: lang[0],
        langList: lang.join(' '),
        group: groupId.uri
      }
    })
      .then(response => this.entities.deserializeModel(response.data))
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

    const frameObject = modelFrame({ '@graph': graph, '@context': context});

    return this.$q.when(new Link(graph, context, frameObject));
  }

  getAllImportableNamespaces(): IPromise<ImportedNamespace[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('listNamespaces'))
      .then(response => this.entities.deserializeImportedNamespaces(response.data));
  }

  newNamespaceImport(namespace: string, prefix: string, label: string, lang: Language): IPromise<ImportedNamespace> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('modelRequirementCreator'), {params: {namespace, prefix, label, lang}})
      .then(response => this.entities.deserializeImportedNamespace(response.data));
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
    .then(response => this.entities.deserializeModelVisualization(response.data));
  }

  getModelPositions(model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('modelPositions'), {
      params: {
        model: model.id.uri
      }
    })
    .then(expandContextWithKnownModels(model))
    .then(response => this.entities.deserializeModelPositions(response.data), () => this.newModelPositions(model));
  }

  updateModelPositions(model: Model, modelPositions: ModelPositions) {
    return this.$http.put(config.apiEndpointWithName('modelPositions'), modelPositions.serialize(), { params: { model: model.id.uri } });
  }

  newModelPositions(model: Model) {
    const frame: any = modelPositionsFrame({ '@context': model.context });
    return new ModelPositions([], frame['@context'], frame);
  }

  getReferenceDataServers(): IPromise<ReferenceDataServer[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeServer'))
      .then(response => this.entities.deserializeReferenceDataServers(response.data));
  }

  getReferenceDatasForServer(server: ReferenceDataServer): IPromise<ReferenceData[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeList'), { params: { uri: server.id.uri } })
      .then(response => this.entities.deserializeReferenceDatas(response.data));
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
        return this.$q.when(cached);
      } else {
        return this.$http.get<GraphData>(config.apiEndpointWithName('codeValues'), {params: {uri: rd.id.uri}})
          .then(response => this.entities.deserializeReferenceDataCodes(response.data))
          .then(codeValues => {
            this.referenceDataCodesCache.set(rd.id.uri, codeValues);
            return codeValues;
          });
      }
    };

    const internalReferenceData = _.filter(normalizeAsArray(referenceData), rd => !rd.isExternal());

    return this.$q.all(_.map(internalReferenceData, rd => getSingle(rd)))
        .then(referenceDatas => _.flatten(referenceDatas));
  }

  newReferenceData(uri: Uri, label: string, description: string, lang: Language): IPromise<ReferenceData> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeListCreator'), {params: {uri: uri.uri, label, description, lang}})
      .then(response => this.entities.deserializeReferenceData(response.data));
  }
}
