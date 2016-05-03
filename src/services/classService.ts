import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import {
  EntityDeserializer,
  Attribute,
  Association,
  Class,
  ClassListItem,
  Predicate,
  Property,
  Model,
  GraphData,
  NamespaceType,
  ExternalEntity,
  Type
} from './entities';
import { PredicateService } from './predicateService';
import { upperCaseFirst } from 'change-case';
import { config } from '../config';
import { expandContextWithKnownModels, hasLocalization } from './utils';
import { Uri, Urn } from './uri';
import { reverseMapType } from './typeMapping';
import { Language } from '../components/contracts';

export class ClassService {

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private predicateService: PredicateService, private entities: EntityDeserializer) {
  }

  getClass(id: Uri|Urn, model: Model): IPromise<Class> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('class'), {params: {id: id.toString()}})
      .then(expandContextWithKnownModels(model))
      .then(response => this.entities.deserializeClass(response.data));
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
      });
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
      .then(expandContextWithKnownModels(model))
      .then((response: any) => this.entities.deserializeClass(response.data))
      .then((klass: Class) => {
        klass.definedBy = model.asDefinedBy();
        klass.unsaved = true;
        klass.external = model.isNamespaceKnownAndOfType(klass.definedBy.id.url, [NamespaceType.EXTERNAL, NamespaceType.TECHNICAL]);
        return klass;
      });
  }

  newShape(klassId: Uri, profile: Model, external: boolean, lang: Language): IPromise<Class> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('shapeCreator'), {params: {profileID: profile.id.uri, classID: klassId.uri, lang}})
      .then(expandContextWithKnownModels(profile))
      .then((response: any) => this.entities.deserializeClass(response.data))
      .then((shape: Class) => {
        shape.definedBy = profile.asDefinedBy();
        shape.unsaved = true;
        shape.external = external;

        for (const property of shape.properties) {
          property.state = 'Unstable';
        }

        return shape;
      });
  }

  newClassFromExternal(externalId: Uri, model: Model) {
    return this.getExternalClass(externalId, model)
      .then(klass => {
        if (!klass) {
          const graph = {
            '@id': externalId.uri,
            '@type': reverseMapType('class'),
            isDefinedBy: model.namespaceAsDefinedBy(externalId.namespace).serialize(true, false)
          };
          return new Class(graph, model.context, model.frame);
        } else {
          return klass;
        }
      });
  }

  getExternalClass(externalId: Uri, model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('externalClass'), {params: {model: model.id.uri, id: externalId.uri}})
      .then(expandContextWithKnownModels(model))
      .then((response: any) => this.entities.deserializeClass(response.data))
      .then(klass => {
        if (klass) {
          klass.external = true;
        }
        return klass;
      });
  }

  getExternalClassesForModel(model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('externalClass'), {params: {model: model.id.uri}}).then(response => this.entities.deserializeClassList(response.data));
  }

  newProperty(predicateOrExternal: Predicate|ExternalEntity, type: Type, model: Model): IPromise<Property> {

    const predicatePromise = (predicateOrExternal instanceof ExternalEntity) ? this.predicateService.getExternalPredicate(predicateOrExternal.id, model) : this.$q.when(<Predicate> predicateOrExternal);

    return this.$q.all([
      predicatePromise,
      this.$http.get<GraphData>(config.apiEndpointWithName('classProperty'), {params: {predicateID: predicateOrExternal.id.uri, type: reverseMapType(type)}})
        .then(expandContextWithKnownModels(model))
        .then((response: any) => this.entities.deserializeProperty(response.data))
    ])
      .then(([predicate, property]: [Predicate, Property]) => {

        if (predicate && !hasLocalization(property.label)) {
          property.label = predicate.label;
        }

        if (type === 'attribute' && !property.dataType) {
          property.dataType = (predicate instanceof Attribute) ? predicate.dataType : 'xsd:string';
        } else if (type === 'assocation' && !property.valueClass && predicate instanceof Association) {
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

  getInternalOrExternalClass(id: Uri, model: Model) {
    const external = model.isNamespaceKnownAndOfType(id.namespace, [NamespaceType.EXTERNAL, NamespaceType.TECHNICAL]);
    return external ? this.getExternalClass(id, model) : this.getClass(id, model);
  }
}
