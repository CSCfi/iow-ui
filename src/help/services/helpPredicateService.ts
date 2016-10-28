import { IQService, IPromise } from 'angular';
import { PredicateService } from '../../services/predicateService';
import { ResetableService } from './resetableService';
import { Predicate, PredicateListItem, Attribute, Association } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { Urn, Uri } from '../../entities/uri';
import { DataSource } from '../../components/form/dataSource';
import { KnownPredicateType } from '../../entities/type';
import { Language } from '../../utils/language';

export class InteractiveHelpPredicateService implements PredicateService, ResetableService {

  /* @ngInject */
  constructor(private $q: IQService, private defaultPredicateService: PredicateService) {
  }

  reset(): IPromise<any> {
    return this.$q.when();
  }

  getPredicate(id: Uri|Urn, model?: Model): IPromise<Predicate> {
    return this.defaultPredicateService.getPredicate(id, model);
  }

  getAllPredicates(model: Model): IPromise<PredicateListItem[]> {
    return this.defaultPredicateService.getAllPredicates(model);
  }

  getPredicatesForModel(model: Model): IPromise<PredicateListItem[]> {
    return this.defaultPredicateService.getPredicatesForModel(model);
  }

  getPredicatesForModelDataSource(modelProvider: () => Model): DataSource<PredicateListItem> {
    return this.defaultPredicateService.getPredicatesForModelDataSource(modelProvider);
  }

  getPredicatesAssignedToModel(model: Model): IPromise<PredicateListItem[]> {
    return this.defaultPredicateService.getPredicatesAssignedToModel(model);
  }

  createPredicate(predicate: Predicate): IPromise<any> {
    return this.defaultPredicateService.createPredicate(predicate);
  }

  updatePredicate(predicate: Predicate, originalId: Uri): IPromise<any> {
    return this.defaultPredicateService.updatePredicate(predicate, originalId);
  }

  deletePredicate(id: Uri, modelId: Uri): IPromise<any> {
    return this.defaultPredicateService.deletePredicate(id, modelId);
  }

  assignPredicateToModel(predicateId: Uri, modelId: Uri): IPromise<any> {
    return this.defaultPredicateService.assignPredicateToModel(predicateId, modelId);
  }

  newPredicate<T extends Attribute|Association>(model: Model, predicateLabel: string, conceptID: Uri, type: KnownPredicateType, lang: Language): IPromise<T> {
    return this.defaultPredicateService.newPredicate(model, predicateLabel, conceptID, type, lang);
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
