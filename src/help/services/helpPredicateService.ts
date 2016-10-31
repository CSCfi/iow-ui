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
import { upperCaseFirst, lowerCaseFirst } from 'change-case';
import { dateSerializer } from '../../entities/serializer/serializer';
import * as frames from '../../entities/frames';

export class InteractiveHelpPredicateService implements PredicateService, ResetableService {

  predicates = new Map<string, Predicate>();

  // With IE9 proxy-polyfill there cannot be any prototype methods not part of public api
  private getPredicatesByPredicate = (predicate: (p: Predicate) => boolean) => {
    const result: Predicate[] = [];

    this.predicates.forEach(p => {
      if (predicate(p)) {
        result.push(p);
      }
    });

    return result;
  };

  /* @ngInject */
  constructor(private $q: IQService, private defaultPredicateService: PredicateService, private helpVocabularyService: VocabularyService) {
  }

  reset(): IPromise<any> {
    this.predicates.clear();
    return this.$q.when();
  }

  getPredicate(id: Uri|Urn, model?: Model): IPromise<Predicate> {
    const predicates = this.getPredicatesByPredicate(p => p.id.toString() === id.toString());

    if (predicates.length > 0) {
      return this.$q.when(predicates[0]);
    } else {
      return this.defaultPredicateService.getPredicate(id, model);
    }
  }

  getAllPredicates(model: Model): IPromise<PredicateListItem[]> {
    return this.$q.all([
      this.defaultPredicateService.getAllPredicates(model)
        .then(predicates => predicates.filter(predicate => predicate.definedBy.id.notEquals(model.id))),
      this.getPredicatesForModel(model)
    ])
      .then(flatten);
  }

  getPredicatesForModel(model: Model): IPromise<PredicateListItem[]> {
    return this.getPredicatesAssignedToModel(model);
  }

  getPredicatesForModelDataSource(modelProvider: () => Model): DataSource<PredicateListItem> {
    return this.defaultPredicateService.getPredicatesForModelDataSource(modelProvider);
  }

  getPredicatesAssignedToModel(_model: Model): IPromise<PredicateListItem[]> {
    return this.$q.when(Array.from(this.predicates.values()));
  }

  createPredicate(predicate: Predicate): IPromise<any> {
    predicate.unsaved = false;
    predicate.createdAt = moment();
    this.predicates.set(predicate.id.uri, predicate);
    return this.$q.when(predicate);
  }

  updatePredicate(predicate: Predicate, originalId: Uri): IPromise<any> {
    this.predicates.delete(originalId.uri);
    predicate.modifiedAt = moment();
    this.predicates.set(predicate.id.uri, predicate);
    return this.$q.when(predicate);
  }

  deletePredicate(id: Uri, _modelId: Uri): IPromise<any> {
    this.predicates.delete(id.uri);
    return this.$q.when();
  }

  assignPredicateToModel(predicateId: Uri, modelId: Uri): IPromise<any> {
    return this.defaultPredicateService.assignPredicateToModel(predicateId, modelId);
  }

  newPredicate<T extends Attribute|Association>(model: Model, predicateLabel: string, conceptID: Uri, type: KnownPredicateType, lang: Language): IPromise<T> {

    return this.$q.all([
      this.helpVocabularyService.getConceptSuggestion(conceptID).then(identity, _err => null),
      this.helpVocabularyService.getFintoConcept(conceptID).then(identity, _err => null)
    ])
      .then(([suggestion, fintoConcept]) => {

        const concept = suggestion || fintoConcept;

        if (!concept) {
          throw new Error('Concept not found');
        }

        const currentTime = dateSerializer.serialize(moment());

        const graph = {
          '@id': model.namespace + lowerCaseFirst(predicateLabel.replace(' ', '')),
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
