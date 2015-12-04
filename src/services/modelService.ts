import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import { EntityDeserializer, Model, ModelListItem, Reference, Require, Uri } from './entities';
import { ModelCache } from './modelCache';
import { Language } from './languageService';
import { upperCaseFirst } from 'change-case';

export class ModelService {

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private modelCache: ModelCache, private entities: EntityDeserializer) {
    this.getAllRequires().then(allRequires => modelCache.updateRequires(allRequires));
  }

  getModelsByGroup(groupUrn: Uri): IPromise<ModelListItem[]> {
    return this.$http.get('/api/rest/model', { params: { group: groupUrn } })
      .then(response => this.entities.deserializeModelList(response.data));
  }

  getModelByUrn(urn: Uri): IPromise<Model> {
    return this.$http.get('/api/rest/model', { params: { id: urn } })
      .then(response => this.entities.deserializeModel(response.data));
  }

  createModel(model: Model): IPromise<boolean> {
    return this.$http.put('/api/rest/model', model.serialize(), { params: { id: model.id, group: model.group.id } })
      .then(() => model.unsaved = false);
  }

  updateModel(model: Model): IHttpPromise<any> {
    return this.$http.post('/api/rest/model', model.serialize(), { params: { id: model.id } });
  }

  deleteModel(id: Uri): IHttpPromise<any> {
    return this.$http.delete('/api/rest/model', { params: { id } });
  }

  newModel(prefix: string, label: string, groupId: Uri, lang: Language): IPromise<Model> {
    return this.$http.get('/api/rest/modelCreator', { params: {prefix, label: upperCaseFirst(label), lang, group: groupId} })
      .then(response => this.entities.deserializeModel(response.data))
      .then((model: Model) => {
        model.unsaved = true;
        return model;
      });
  }

  newReference(scheme: any, lang: Language, context: any): IPromise<Reference> {
    return this.$q.when(
      new Reference({
        '@id': `http://www.finto.fi/${scheme.id}`,
        '@type': 'skos:ConceptScheme',
        'dct:identifier': scheme.id,
        'title': {
          [lang]: scheme.title
        }
      }, context));
  }

  getAllRequires(): IPromise<Require[]> {
    return this.$http.get('/api/rest/model')
      .then(response => this.entities.deserializeRequires(response.data));
  }

  newRequire(namespace: Uri, prefix: string, label: string, lang: Language): IPromise<Require> {
    return this.$http.get('/api/rest/modelRequirementCreator', {params: {namespace, prefix, label, lang}})
      .then(response => this.entities.deserializeRequire(response.data));
  }
}
