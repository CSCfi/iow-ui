import { IPromise, IQService } from 'angular';
import { ImportedNamespace, Link, Model, ModelListItem } from '../../entities/model';
import { Language } from '../../utils/language';
import { Uri, Urn } from '../../entities/uri';
import { KnownModelType } from '../../entities/type';
import { ModelService } from '../../services/modelService';
import { ResetableService } from './resetableService';
import moment = require('moment');
import * as _ from 'lodash';
import { InteractiveHelpClassService } from './helpClassService';
import { InteractiveHelpPredicateService } from './helpPredicateService';
import { ResourceStore } from './resourceStore';

export class InteractiveHelpModelService implements ModelService, ResetableService {

  store = new ResourceStore<Model>();

  /* @ngInject */
  constructor(private $q: IQService,
              private defaultModelService: ModelService,
              private helpClassService: InteractiveHelpClassService,
              private helpPredicateService: InteractiveHelpPredicateService) {
  }

  reset(): IPromise<any> {
    this.store.clear();
    return this.$q.when();
  }

  getModelsByGroup(groupUrn: Uri): IPromise<ModelListItem[]> {

    const storeModels = this.store.findAll(model => model.groupId.equals(groupUrn));

    return this.defaultModelService.getModelsByGroup(groupUrn).then(models => [...models, ...storeModels]);
  }

  getModelByUrn(urn: Uri|Urn): IPromise<Model> {

    const storeModel = this.store.findFirst(model => model.id.uri === urn.toString());

    if (storeModel) {
      return this.$q.when(storeModel);
    } else {
      return this.defaultModelService.getModelByUrn(urn);
    }
  }

  getModelByPrefix(prefix: string): IPromise<Model> {

    const storeModel = this.store.findFirst(model => model.prefix === prefix);

    if (storeModel) {
      return this.$q.when(storeModel);
    } else {
      return this.defaultModelService.getModelByPrefix(prefix);
    }
  }

  createModel(model: Model): IPromise<any> {
    model.unsaved = false;
    model.createdAt = moment();
    this.store.add(model);
    this.helpClassService.trackModel(model);
    this.helpPredicateService.trackModel(model);
    return this.$q.when();
  }

  updateModel(model: Model): IPromise<any> {
    model.modifiedAt = moment();
    this.store.add(model);
    return this.$q.when();
  }

  deleteModel(id: Uri): IPromise<any> {
    this.store.delete(id.uri);
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
