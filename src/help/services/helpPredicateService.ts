import { IQService, IPromise } from 'angular';
import { PredicateService } from '../../services/predicateService';
import { ResetableService } from './resetableService';
import { Predicate, PredicateListItem, Attribute, Association } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { Urn, Uri } from '../../entities/uri';
import { DataSource } from '../../components/form/dataSource';
import { KnownPredicateType, reverseMapType } from '../../entities/type';
import { Language } from '../../utils/language';
import { flatten } from '../../utils/array';
import moment = require('moment');
import { VocabularyService } from '../../services/vocabularyService';
import { identity } from '../../utils/function';
import { upperCaseFirst } from 'change-case';
import { dateSerializer } from '../../entities/serializer/serializer';
import * as frames from '../../entities/frames';
import { ModelResourceStore } from './resourceStore';
import { DefinedBy } from '../../entities/definedBy';
import { predicateNameToResourceIdName } from '../utils';

export class InteractiveHelpPredicateService implements PredicateService, ResetableService {

  store = new ModelResourceStore(this.$q, (id, model) => this.getPredicate(id, model));
  trackedModels = new Set<string>();

  trackModel = (model: Model|DefinedBy) => this.trackedModels.add(model.id.uri);
  tracksModel = (model: Model|DefinedBy) => this.trackedModels.has(model.id.uri);

  /* @ngInject */
  constructor(private $q: IQService, private defaultPredicateService: PredicateService, private helpVocabularyService: VocabularyService) {
  }

  reset(): IPromise<any> {
    this.store.clear();
    return this.$q.when();
  }

  getPredicate(id: Uri|Urn, model: Model): IPromise<Predicate> {

    const resource = this.store.getResourceForAnyModelById(id);

    if (resource) {
      return this.$q.when(resource);
    } else {
      return this.defaultPredicateService.getPredicate(id, model);
    }
  }

  getAllPredicates(model: Model): IPromise<PredicateListItem[]> {

    const resources = this.store.getResourcesForAllModels();

    return this.defaultPredicateService.getAllPredicates(model)
      .then(classes => classes.filter(klass => !resources.has(klass.id.toString())))
      .then(nonConflictingClasses => flatten([nonConflictingClasses, Array.from(resources.values())]));
  }

  getPredicatesForModel(model: Model): IPromise<PredicateListItem[]> {
    if (this.tracksModel(model)) {
      return this.store.getAllResourceValuesForModel(model);
    } else {
      return this.defaultPredicateService.getPredicatesForModel(model);
    }
  }

  getPredicatesForModelDataSource(modelProvider: () => Model): DataSource<PredicateListItem> {
    return (_search: string) => this.getPredicatesForModel(modelProvider());
  }

  getPredicatesAssignedToModel(model: Model): IPromise<PredicateListItem[]> {
    if (this.tracksModel(model)) {
      return this.store.getAllResourceValuesForModel(model);
    } else {
      return this.defaultPredicateService.getPredicatesAssignedToModel(model);
    }
  }

  createPredicate(predicate: Predicate): IPromise<any> {
    predicate.unsaved = false;
    predicate.createdAt = moment();
    this.store.addResourceToModel(predicate.definedBy, predicate);
    return this.$q.when(predicate);
  }

  updatePredicate(predicate: Predicate, originalId: Uri): IPromise<any> {
    predicate.modifiedAt = moment();
    this.store.updateResourceInModel(predicate.definedBy, predicate, originalId.uri);
    return this.$q.when(predicate);
  }

  deletePredicate(id: Uri, model: Model): IPromise<any> {
    this.store.deleteResourceFromModel(model, id.uri);
    return this.$q.when();
  }

  assignPredicateToModel(predicateId: Uri, model: Model): IPromise<any> {
    this.store.assignResourceToModel(model, predicateId.uri);
    return this.$q.when();
  }

  newPredicate<T extends Attribute|Association>(model: Model, predicateLabel: string, conceptID: Uri, type: KnownPredicateType, lang: Language): IPromise<T> {

    return this.helpVocabularyService.getConcept(conceptID).then(identity, _err => null)
      .then(concept => {

        if (!concept) {
          throw new Error('Concept not found');
        }

        const currentTime = dateSerializer.serialize(moment());

        const graph = {
          '@id': model.namespace + predicateNameToResourceIdName(predicateLabel),
          '@type': reverseMapType(type),
          created: currentTime,
          modified: currentTime,
          subject: concept.serialize(true, false),
          label: { [lang]: upperCaseFirst(predicateLabel) },
          comment: Object.assign({}, concept.comment),
          isDefinedBy: model.asDefinedBy().serialize(true, false),
          versionInfo: 'Unstable'
        };

        const context = Object.assign({}, model.context, { [model.prefix]: model.namespace });
        const newPredicate = new Predicate(graph, context, frames.predicateFrame(graph));
        newPredicate.unsaved = true;
        return newPredicate;
      });
  }

  changePredicateType(predicate: Attribute|Association, newType: KnownPredicateType, model: Model): IPromise<Predicate> {
    return this.defaultPredicateService.changePredicateType(predicate, newType, model);
  }

  copyPredicate(predicate: Predicate|Uri, type: KnownPredicateType, model: Model): IPromise<Predicate> {
    return this.defaultPredicateService.copyPredicate(predicate, type, model);
  }

  getExternalPredicate(externalId: Uri, model: Model): IPromise<Predicate> {
    return this.defaultPredicateService.getExternalPredicate(externalId, model);
  }

  getExternalPredicatesForModel(model: Model): IPromise<PredicateListItem[]> {
    return this.defaultPredicateService.getExternalPredicatesForModel(model);
  }
}
