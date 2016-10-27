import { IPromise, IQService, IHttpService } from 'angular';
import { ClassService } from '../../services/classService';
import { Class, ClassListItem, Property } from '../../entities/class';
import { Model } from '../../entities/model';
import { Urn, Uri } from '../../entities/uri';
import { DataSource } from '../../components/form/dataSource';
import { Language } from '../../utils/language';
import { ExternalEntity } from '../../entities/externalEntity';
import { Predicate } from '../../entities/predicate';
import { KnownPredicateType } from '../../entities/type';
import { ResetableService } from './resetableService';
import moment = require('moment');
import { expandContextWithKnownModels } from '../../utils/entity';
import { upperCaseFirst } from 'change-case';
import { config } from '../../config';
import { GraphData } from '../../entities/contract';
import { FrameService } from '../../services/frameService';
import * as frames from '../../entities/frames';
import { VocabularyService } from '../../services/vocabularyService';
import { identity } from '../../utils/function';

export class InteractiveHelpClassService implements ClassService, ResetableService {

  private classes = new Map<string, Class>();

  // With IE9 proxy-polyfill there cannot be any prototype methods not part of public api
  private getClassesByPredicate = (predicate: (klass: Class) => boolean) => {
    const result: Class[] = [];

    this.classes.forEach(klass => {
      if (predicate(klass)) {
        result.push(klass);
      }
    });

    return result;
  };


  /* @ngInject */
  constructor(private $http: IHttpService,
              private $q: IQService,
              private defaultClassService: ClassService,
              private helpVocabularyService: VocabularyService,
              private frameService: FrameService) {
  }


  reset(): IPromise<any> {
    this.classes.clear();
    return this.$q.when();
  }

  getClass(id: Uri|Urn, model: Model): IPromise<Class> {

    const classes = this.getClassesByPredicate(klass => klass.id.toString() === id.toString());

    if (classes.length > 0) {
      return this.$q.when(classes[0]);
    } else {
      return this.defaultClassService.getClass(id, model);
    }
  }

  getAllClasses(model: Model): IPromise<ClassListItem[]> {
    return this.defaultClassService.getAllClasses(model);
  }

  getClassesForModel(model: Model): IPromise<ClassListItem[]> {
    return this.defaultClassService.getClassesForModel(model);
  }

  getClassesForModelDataSource(modelProvider: () => Model): DataSource<ClassListItem> {
    return this.defaultClassService.getClassesForModelDataSource(modelProvider);
  }

  getClassesAssignedToModel(model: Model): IPromise<ClassListItem[]> {
    return this.defaultClassService.getClassesAssignedToModel(model);
  }

  createClass(klass: Class): IPromise<any> {
    klass.unsaved = false;
    klass.createdAt = moment();
    this.classes.set(klass.id.uri, klass);
    return this.$q.when();
  }

  updateClass(klass: Class, originalId: Uri): IPromise<any> {
    this.classes.delete(originalId.uri);
    klass.modifiedAt = moment();
    this.classes.set(klass.id.uri, klass);
    return this.$q.when();
  }

  deleteClass(id: Uri, _modelId: Uri): IPromise<any> {
    this.classes.delete(id.uri);
    return this.$q.when();
  }

  assignClassToModel(classId: Uri, modelId: Uri): IPromise<any> {
    return this.defaultClassService.assignClassToModel(classId, modelId);
  }

  newClass(model: Model, classLabel: string, conceptID: Uri, lang: Language): IPromise<Class> {

    const temporaryKnownConcept = 'http://jhsmeta.fi/skos/J187';
    const temporaryKnownModelId = model.id.withName('jhs');

    return this.helpVocabularyService.getConceptSuggestion(conceptID)
      .then(identity, _err => null)
      .then(suggestion => {

        const params = {
          modelID: temporaryKnownModelId.uri,
          classLabel: upperCaseFirst(classLabel),
          conceptID: suggestion ? temporaryKnownConcept : conceptID,
          lang
        };

        return this.$http.get<GraphData>(config.apiEndpointWithName('classCreator'), { params })
          .then(expandContextWithKnownModels(model))
          .then((response: any) => this.deserializeClass(response.data!))
          .then((klass: Class) => {
            klass.id = new Uri(model.namespace + klass.id.name, klass.context);
            klass.definedBy = model.asDefinedBy();
            klass.unsaved = true;
            klass.external = model.isNamespaceKnownToBeNotModel(klass.definedBy.id.toString());

            if (suggestion) {
              klass.subject = suggestion;
              klass.comment = Object.assign({}, suggestion.comment);
            }

            return klass;
          });
      });
  }

  newShape(classOrExternal: Class|ExternalEntity, profile: Model, external: boolean, lang: Language): IPromise<Class> {
    return this.defaultClassService.newShape(classOrExternal, profile, external, lang);
  }

  newClassFromExternal(externalId: Uri, model: Model): IPromise<Class> {
    return this.defaultClassService.newClassFromExternal(externalId, model);
  }

  getExternalClass(externalId: Uri, model: Model): IPromise<Class> {
    return this.defaultClassService.getExternalClass(externalId, model);
  }

  getExternalClassesForModel(model: Model): IPromise<ClassListItem[]> {
    return this.defaultClassService.getExternalClassesForModel(model);
  }

  newProperty(predicateOrExternal: Predicate|ExternalEntity, type: KnownPredicateType, model: Model): IPromise<Property> {
    return this.defaultClassService.newProperty(predicateOrExternal, type, model);
  }

  getInternalOrExternalClass(id: Uri, model: Model): IPromise<Class> {
    return this.defaultClassService.getInternalOrExternalClass(id, model);
  }

  private deserializeClass(data: GraphData): IPromise<Class> {
    return this.frameService.frameAndMap(data, true, frames.classFrame(data), () => Class);
  }
}
