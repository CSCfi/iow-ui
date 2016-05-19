import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import { config } from '../config';
import {
  EntityDeserializer, Model, ModelListItem, Reference, Require, Type, GraphData, Relation,
  CodeScheme, CodeServer, CodeValue
} from './entities';
import { upperCaseFirst } from 'change-case';
import { modelFrame } from './frames';
import { Uri, Urn } from './uri';
import { Language } from '../utils/language';
import { expandContextWithKnownModels } from '../utils/entity';

export class ModelService {

  private codeValuesCache = new Map<string, CodeValue[]>();

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private entities: EntityDeserializer) {
  }

  getModelsByGroup(groupUrn: Uri): IPromise<ModelListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('model'), { params: { group: groupUrn.uri } })
      .then(response => this.entities.deserializeModelList(response.data));
  }

  getModelByUrn(urn: Uri|Urn): IPromise<Model> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('model'), { params: { id: urn.toString() } })
      .then(response => this.entities.deserializeModel(response.data));
  }

  createModel(model: Model): IPromise<any> {
    return this.$http.put<{ identifier: Urn }>(config.apiEndpointWithName('model'), model.serialize(), { params: { id: model.id.uri, group: model.group.id.uri } })
      .then(response => {
        model.unsaved = false;
        model.version = response.data.identifier;
      });
  }

  updateModel(model: Model): IPromise<any> {
    return this.$http.post<{ identifier: Urn }>(config.apiEndpointWithName('model'), model.serialize(), { params: { id: model.id.uri } })
      .then(response => {
        model.version = response.data.identifier;
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

  newReference(scheme: any, lang: Language, context: any): IPromise<Reference> {

    const graph = {
      '@id': config.fintoUrl + scheme.id,
      '@type': 'skos:ConceptScheme',
      'identifier': scheme.id,
      'title': {
        [lang]: scheme.title
      }
    };

    const frameObject = modelFrame({ '@graph': graph, '@context': context});

    return this.$q.when(new Reference(graph, context, frameObject));
  }

  newRelation(title: string, description: string, homepage: Uri, lang: Language, context: any) {
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

    return this.$q.when(new Relation(graph, context, frameObject));
  }

  getAllRequires(): IPromise<Require[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('listNamespaces'))
      .then(response => this.entities.deserializeRequires(response.data));
  }

  newRequire(namespace: string, prefix: string, label: string, lang: Language): IPromise<Require> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('modelRequirementCreator'), {params: {namespace, prefix, label, lang}})
      .then(response => this.entities.deserializeRequire(response.data));
  }

  getVisualizationData(model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('exportModel'), {
        params: {
          graph: model.id.uri,
          'content-type': 'application/ld+json'
        }
      })
      .then(expandContextWithKnownModels(model))
      .then(response => this.entities.deserializeModelVisualization(response.data));
  }

  getCodeServers(): IPromise<CodeServer[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeServer'))
      .then(response => this.entities.deserializeCodeServers(response.data));
  }

  getCodeSchemesForServer(server: CodeServer): IPromise<CodeScheme[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeList'), { params: { uri: server.id.uri } })
      .then(response => this.entities.deserializeCodeSchemes(response.data));
  }

  getCodeSchemesForServers(servers: CodeServer[]): IPromise<CodeScheme[]> {
    return this.$q.all(_.map(servers, server => this.getCodeSchemesForServer(server)))
      .then(schemeLists => _.flatten(schemeLists));
  }

  getAllCodeSchemes(): IPromise<CodeScheme[]> {
    return this.getCodeServers().then(servers => this.getCodeSchemesForServers(servers));
  }

  getCodeValues(codeScheme: CodeScheme) {

    const cached = this.codeValuesCache.get(codeScheme.id.uri);

    if (cached) {
      return this.$q.when(cached);
    } else {
      return this.$http.get<GraphData>(config.apiEndpointWithName('codeValues'), { params: { uri: codeScheme.id.uri } })
        .then(response => this.entities.deserializeCodeValues(response.data))
        .then(codeValues => {
          this.codeValuesCache.set(codeScheme.id.uri, codeValues);
          return codeValues;
        });
    }
  }

  newCodeScheme(uri: Uri, label: string, description: string, lang: Language): IPromise<CodeScheme> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeListCreator'), {params: {uri: uri.uri, label, description, lang}})
      .then(response => this.entities.deserializeCodeScheme(response.data));
  }
}
