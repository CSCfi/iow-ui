import { IHttpService, IPromise, IQService } from 'angular';
import * as moment from 'moment';
import { config } from '../config';
import { upperCaseFirst } from 'change-case';
import { Uri, Urn } from '../entities/uri';
import { Language } from '../utils/language';
import { assertNever } from '../utils/object';
import * as frames from '../entities/frames';
import { FrameService } from './frameService';
import { GraphData } from '../entities/contract';
import { KnownModelType } from '../entities/type';
import { Model, ModelListItem, ImportedNamespace, Link } from '../entities/model';

export interface ModelService {
  getModelsByGroup(groupUrn: Uri): IPromise<ModelListItem[]>;
  getModelByUrn(urn: Uri|Urn): IPromise<Model>;
  getModelByPrefix(prefix: string): IPromise<Model>;
  createModel(model: Model): IPromise<any>;
  updateModel(model: Model): IPromise<any>;
  deleteModel(id: Uri): IPromise<any>;
  newModel(prefix: string, label: string, groupId: Uri, lang: Language[], type: KnownModelType, redirect?: Uri): IPromise<Model>;
  newLink(title: string, description: string, homepage: Uri, lang: Language, context: any): IPromise<Link>;
  getAllImportableNamespaces(): IPromise<ImportedNamespace[]>;
  newNamespaceImport(namespace: string, prefix: string, label: string, lang: Language): IPromise<ImportedNamespace>;
}

export class DefaultModelService implements ModelService {

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

  deleteModel(id: Uri): IPromise<any> {
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
}
