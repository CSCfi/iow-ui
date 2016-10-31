import { IPromise, IQService } from 'angular';
import { ClassService } from '../../services/classService';
import { Class, ClassListItem, Property } from '../../entities/class';
import { Model } from '../../entities/model';
import { Urn, Uri } from '../../entities/uri';
import { DataSource } from '../../components/form/dataSource';
import { Language } from '../../utils/language';
import { ExternalEntity } from '../../entities/externalEntity';
import { Predicate, Association, Attribute } from '../../entities/predicate';
import { KnownPredicateType, reverseMapType } from '../../entities/type';
import { ResetableService } from './resetableService';
import moment = require('moment');
import { upperCaseFirst } from 'change-case';
import * as frames from '../../entities/frames';
import { VocabularyService } from '../../services/vocabularyService';
import { identity } from '../../utils/function';
import { flatten } from '../../utils/array';
import { dateSerializer } from '../../entities/serializer/serializer';

export class InteractiveHelpClassService implements ClassService, ResetableService {

  classes = new Map<string, Class>();

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
  constructor(private $q: IQService,
              private defaultClassService: ClassService,
              private helpVocabularyService: VocabularyService) {
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
    return this.$q.all([
      this.defaultClassService.getAllClasses(model)
        .then(classes => classes.filter(klass => klass.definedBy.id.notEquals(model.id))),
      this.getClassesForModel(model)
    ])
      .then(flatten);
  }

  getClassesForModel(model: Model): IPromise<ClassListItem[]> {
    return this.getClassesAssignedToModel(model);
  }

  getClassesForModelDataSource(modelProvider: () => Model): DataSource<ClassListItem> {
    return this.defaultClassService.getClassesForModelDataSource(modelProvider);
  }

  getClassesAssignedToModel(_model: Model): IPromise<ClassListItem[]> {
    return this.$q.when(Array.from(this.classes.values()));
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
          '@id': model.namespace + upperCaseFirst(classLabel.replace(' ', '')),
          '@type': 'rdfs:Class',
          created: currentTime,
          modified: currentTime,
          subject: concept.serialize(true, false),
          label: { [lang]: upperCaseFirst(classLabel) },
          comment: Object.assign({}, concept.comment),
          isDefinedBy: model.asDefinedBy().serialize(true, false),
          versionInfo: 'Unstable'
        };

        const context = Object.assign({}, model.context, { [model.prefix]: model.namespace });
        const newClass = new Class(graph, context, frames.classFrame(graph));
        newClass.unsaved = true;
        return newClass;
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
    if (predicateOrExternal instanceof ExternalEntity) {
      return this.defaultClassService.newProperty(predicateOrExternal, type, model);
    } else {

      const currentTime = dateSerializer.serialize(moment());
      const context = Object.assign({}, model.context, predicateOrExternal.context, { [model.prefix]: model.namespace });

      const graph: any = {
        '@id': Uri.randomUUID().toString(),
        created: currentTime,
        type: reverseMapType(type),
        label: Object.assign({}, predicateOrExternal.label),
        comment: Object.assign({}, predicateOrExternal.comment),
        predicate: predicateOrExternal.id.curie
      };

      if (type === 'attribute') {
        if (!predicateIsAttribute(predicateOrExternal)) {
          throw new Error('Predicate must be attribute');
        }
        graph.datatype = predicateOrExternal.dataType || 'xsd:string';
      } else {
        if (!predicateIsAssociation(predicateOrExternal)) {
          throw new Error('Predicate must be association');
        }
        graph.valueShape = predicateOrExternal.valueClass && predicateOrExternal.valueClass.curie;
      }

      const newProperty = new Property(graph, context, frames.propertyFrame(graph));
      newProperty.state = 'Unstable';

      return this.$q.when(newProperty);
    }
  }

  getInternalOrExternalClass(id: Uri, model: Model): IPromise<Class> {
    return this.defaultClassService.getInternalOrExternalClass(id, model);
  }
}

function predicateIsAssociation(predicate: Predicate): predicate is Association {
  return predicate.isOfType('association');
}

function predicateIsAttribute(predicate: Predicate): predicate is Attribute {
  return predicate.isOfType('attribute');
}
