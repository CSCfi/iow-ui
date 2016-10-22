import { IPromise, IQService } from 'angular';
import { ImportedNamespace, Link, Model, ModelListItem } from '../../entities/model';
import { Language } from '../../utils/language';
import { Uri, Urn } from '../../entities/uri';
import { KnownModelType } from '../../entities/type';
import { ModelService } from '../../services/modelService';
import { ResetableService } from './resetableService';
import moment = require('moment');
import * as _ from 'lodash';

export class InteractiveHelpModelService implements ModelService, ResetableService {

  private models = new Map<string, Model>();

  /* @ngInject */
  constructor(private $q: IQService, private defaultModelService: ModelService) {
  }

  reset(): IPromise<any> {
    this.models.clear();
    return this.$q.when();
  }

  private getModelsByPredicate(predicate: (model: Model) => boolean): Model[] {
    const result: Model[] = [];

    this.models.forEach(model => {
      if (predicate(model)) {
        result.push(model);
      }
    });

    return result;
  }

  getModelsByGroup(groupUrn: Uri): IPromise<ModelListItem[]> {
    return this.$q.when(this.getModelsByPredicate(model => model.groupId.equals(groupUrn)));
  }

  getModelByUrn(urn: Uri|Urn): IPromise<Model> {
    return this.defaultModelService.getModelByUrn(urn);
  }

  getModelByPrefix(prefix: string): IPromise<Model> {

    const models = this.getModelsByPredicate(model => model.prefix === prefix);

    if (models.length > 0) {
      return this.$q.when(models[0]);
    } else {
      return this.$q.reject();
    }
  }

  createModel(model: Model): IPromise<any> {
    model.unsaved = false;
    model.createdAt = moment();
    this.models.set(model.id.uri, model);
    return this.$q.when();
  }

  updateModel(model: Model): IPromise<any> {
    model.modifiedAt = moment();
    this.models.set(model.id.uri, model);
    return this.$q.when();
  }

  deleteModel(id: Uri): IPromise<any> {
    this.models.delete(id.uri);
    return this.$q.when();
  }

  newModel(prefix: string, label: string, groupId: Uri, lang: Language[], type: KnownModelType, redirect?: Uri): IPromise<Model> {
    const temporaryNonConflictingPrefix = 'mkowhero';
    return this.defaultModelService.newModel(temporaryNonConflictingPrefix, label, groupId, lang, type, redirect)
      .then(model => {
        const id = new Uri(_.trimEnd(model.namespace, '#'), model.context).withName(prefix);
        model.prefix = prefix;
        model.namespace = id.toString() + '#';
        model.id = id;
        return model;
      });
  }

  newLink(title: string, description: string, homepage: Uri, lang: Language, context: any): IPromise<Link> {
    return this.defaultModelService.newLink(title, description, homepage, lang, context);
  }

  getAllImportableNamespaces(): IPromise<ImportedNamespace[]> {
    return this.defaultModelService.getAllImportableNamespaces();
  }

  newNamespaceImport(namespace: string, prefix: string, label: string, lang: Language): IPromise<ImportedNamespace> {
    return this.defaultModelService.newNamespaceImport(namespace, prefix, label, lang);
  }
}
