import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import {
  EntityDeserializer,
  Attribute,
  Association,
  Class,
  ClassListItem,
  Predicate,
  Property,
  Model,
  Uri,
  Urn, GraphData
} from './entities';
import { PredicateService } from './predicateService';
import { Language } from './languageService';
import { upperCaseFirst } from 'change-case';
import { config } from '../config';

export class ClassService {

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private predicateService: PredicateService, private entities: EntityDeserializer) {
  }

  getClass(id: Uri|Urn): IPromise<Class> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('class'), {params: {id: id.toString()}}).then(response => this.entities.deserializeClass(response.data));
  }

  getAllClasses(): IPromise<ClassListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('class')).then(response => this.entities.deserializeClassList(response.data));
  }

  getClassesForModel(modelId: Uri): IPromise<ClassListItem[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('class'), {params: {model: modelId.uri}}).then(response => this.entities.deserializeClassList(response.data));
  }

  createClass(klass: Class): IPromise<any> {
    const requestParams = {
      id: klass.id.uri,
      model: klass.definedBy.id.uri
    };
    return this.$http.put<{ identifier: Urn }>(config.apiEndpointWithName('class'), klass.serialize(), {params: requestParams})
      .then(response => {
        klass.unsaved = false;
        klass.version = response.data.identifier;
      });
  }

  updateClass(klass: Class, originalId: Uri): IPromise<any> {
    const requestParams: any = {
      id: klass.id.uri,
      model: klass.definedBy.id.uri
    };
    if (klass.id.notEquals(originalId)) {
      requestParams.oldid = originalId.uri;
    }
    return this.$http.post<{ identifier: Urn }>(config.apiEndpointWithName('class'), klass.serialize(), {params: requestParams})
      .then(response => {
        klass.version = response.data.identifier;
      })
  }

  deleteClass(id: Uri, modelId: Uri): IHttpPromise<any> {
    const requestParams = {
      id: id.uri,
      model: modelId.uri
    };
    return this.$http.delete(config.apiEndpointWithName('class'), {params: requestParams});
  }

  assignClassToModel(classId: Uri, modelId: Uri): IHttpPromise<any> {
    const requestParams = {
      id: classId.uri,
      model: modelId.uri
    };
    return this.$http.post(config.apiEndpointWithName('class'), undefined, {params: requestParams});
  }

  newClass(model: Model, classLabel: string, conceptID: Uri, lang: Language): IPromise<Class> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('classCreator'), {params: {modelID: model.id.uri, classLabel: upperCaseFirst(classLabel), conceptID: conceptID.uri, lang}})
      .then((response: any) => {
        _.extend(response.data['@context'], model.context);
        return this.entities.deserializeClass(response.data);
      })
      .then((klass: Class) => {
        klass.definedBy = model.asDefinedBy();
        klass.unsaved = true;
        return klass;
      });
  }

  newShape(klass: Class, profile: Model, lang: Language): IPromise<Class> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('shapeCreator'), {params: {profileID: profile.id.uri, classID: klass.id.uri, lang}})
      .then((response: any) => {
        _.extend(response.data['@context'], profile.context);
        return this.entities.deserializeClass(response.data);
      })
      .then((shape: Class) => {
        shape.definedBy = profile.asDefinedBy();
        shape.subject = klass.subject;
        shape.unsaved = true;
        return shape;
      });
  }

  newProperty(predicateId: Uri): IPromise<Property> {
    return this.$q.all([
        this.predicateService.getPredicate(predicateId),
        this.$http.get<GraphData>(config.apiEndpointWithName('classProperty'), {params: {predicateID: predicateId.uri}})
      ])
      .then(([predicate, propertyResult]: [Predicate, any]) => {
        predicate.expandContext(propertyResult.data['@context']);
        return this.$q.all([
          this.$q.when(predicate),
          this.entities.deserializeProperty(propertyResult.data)
        ])})
      .then(([predicate, property]: [Predicate, Property]) => {
        if (!property.label) {
          property.label = predicate.label;
        }

        if (predicate instanceof Attribute && !property.dataType) {
          property.dataType = predicate.dataType || 'xsd:string';
        } else if (predicate instanceof Association && !property.valueClass) {
          property.valueClass = predicate.valueClass;
        }

        property.state = 'Unstable';

        return property;
      });
  }

  getVisualizationData(model: Model, classId: Uri) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('classVisualizer'), {params: {classID: classId.uri, modelID: model.id.uri}})
      .then(response => {
        model.expandContext(response.data);
        return this.entities.deserializeClassVisualization(response.data);
      });
  }
}
