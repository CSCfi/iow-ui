import IPromise = angular.IPromise;
import * as _ from 'lodash';
import * as frames from './frames';
import { glyphIconClassForType, normalizeAsArray, splitCurie } from './utils';
import { ModelCache } from './modelCache';

const jsonld: any = require('jsonld');

export type Localizable = { [language: string]: string; }
export type Uri = string;
export type Url = string;
export type RelativeUrl = string;
export type Curie = string;
export type Type = string;
export type State = string;

export const states = {
  unstable:'Unstable',
  draft: 'Draft',
  recommendation: 'Recommendation',
  deprecated: 'Deprecated'
};

type EntityFactory<T extends GraphNode> = (graph: any, context: any) => T

export function isLocalizable(obj: any): obj is Localizable {
  return typeof obj === 'object';
}

export interface Location {
  localizationKey?: string;
  label?: Localizable;
  iowUrl?(): string;
}

export interface WithIdAndType {
  id: Uri,
  type: Type
}

export class ExpandedCurie {
  constructor(public namespace: string, public value: string) {
  }

  isDefined(): boolean {
    return !!this.namespace;
  }

  get uri(): Uri {
    return this.namespace + this.value;
  }

  withValue(value: string) {
    return new ExpandedCurie(this.namespace, value);
  }
}

export abstract class GraphNode {

  constructor(public type: Type, public graph: any, public context: any) {
  }

  get glyphIconClass(): any {
    return glyphIconClassForType(this.type);
  }

  serializationValues(): {} {
    return {};
  }

  expandContext(data: any) {
    Object.assign(data['@context'], this.context);
    return data;
  }

  expandCurie(curie: Curie) {
    if (curie) {
      const split = splitCurie(curie);
      if (split) {
        return new ExpandedCurie(this.context[split.prefix], split.value);
      }
    }
  }

  isCurieDefinedInModel(curie: string, modelCache: ModelCache) {
    const expanded = this.expandCurie(curie);
    if (expanded) {
      return modelCache.modelIdForNamespace(expanded.namespace);
    }
  }

  linkToCurie(type: Type, curie: Curie, modelCache: ModelCache) {
    if (curie) {
      const expanded = this.expandCurie(curie);
      if (expanded) {
        const {namespace, value} = expanded;
        const id = modelCache.modelIdForNamespace(namespace);
        if (!type || !id) {
          return namespace + value;
        } else if (type && id) {
          return selectableUrl(namespace + value, type);
        }
      }
    }
  }

  serialize(inline: boolean = false): any {
    const values = Object.assign(this.graph, this.serializationValues());

    if (inline) {
      return values;
    } else {
      return {
        '@graph': values,
        '@context': this.context
      };
    }
  }
}

export abstract class AbstractGroup extends GraphNode implements Location {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  homepage: Uri;

  constructor(graph: any, context: any) {
    super('group', graph, context);
    this.id = graph['@id'];
    this.label = graph.label;
    this.comment = graph.comment;
    this.homepage = graph.homepage;
  }

  get groupId() {
    return this.id;
  }

  iowUrl() {
    return groupUrl(this.id);
  }
}

export class GroupListItem extends AbstractGroup {
  constructor(graph: any, context: any) {
    super(graph, context);
  }
}

export class Group extends AbstractGroup {

  unsaved: boolean;

  constructor(graph: any, context: any) {
    super(graph, context);
  }

  clone(): Group {
    const serialization = this.serialize();
    return new Group(serialization['@graph'], serialization['@context']);
  }
}

abstract class AbstractModel extends GraphNode implements Location {

  id: Uri;
  label: Localizable;

  constructor(graph: any, context: any) {
    super('model', graph, context);
    this.id = graph['@id'];
    this.label = graph.label;
  }

  iowUrl() {
    return modelUrl(this.id);
  }
}

export class ModelListItem extends AbstractModel {
  constructor(graph: any, context: any) {
    super(graph, context);
  }
}

export class Model extends AbstractModel {

  comment: Localizable;
  state: State;
  references: Reference[];
  requires: Require[];
  unsaved: boolean = false;
  namespace: Uri;
  prefix: string;
  group: GroupListItem;

  constructor(graph: any, context: any) {
    super(graph, context);
    this.comment = graph.comment;
    this.state = graph.versionInfo;
    this.namespace = graph['dcap:preferredXMLNamespaceName'];
    this.prefix = graph['dcap:preferredXMLNamespacePrefix'];
    this.group = new GroupListItem(graph.isPartOf, context);
    this.references = _.map(normalizeAsArray(graph.references), reference => new Reference(reference, context));
    this.requires = _.map(normalizeAsArray(graph.requires), require => new Require(require, context));
    this.copyNamespacesFromRequires();
  }

  get groupId() {
    return this.group.id;
  }

  addReference(reference: Reference) {
    this.references.push(reference);
  }

  removeReference(reference: Reference) {
    _.remove(this.references, reference);
  }

  addRequire(require: Require) {
    this.requires.push(require);
  }

  removeRequire(require: Require) {
    _.remove(this.requires, require);
  }

  copyNamespacesFromRequires() {
    _.forEach(this.requires, require => {
      this.context[require.prefix] = require.namespace;
    });
  }

  clone(): Model {
    const serialization = this.serialize();
    return new Model(serialization['@graph'], serialization['@context']);
  }

  serializationValues(): any {
    this.copyNamespacesFromRequires();

    return {
      '@id': this.id,
      label: Object.assign({}, this.label),
      comment: Object.assign({}, this.comment),
      versionInfo: this.state,
      references: _.map(this.references, reference => reference.serialize(true)),
      requires: _.map(this.requires, require => require.serialize(true))
    }
  }
}

export class Reference extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  vocabularyId: string;

  constructor(graph: any, context: any) {
    super('reference', graph, context);
    this.vocabularyId = graph['dcterms:identifier'];
    this.id = graph['@id'];
    this.label = graph.title;
    this.comment = graph.comment;
  }
}

export class Require extends GraphNode {

  id: Uri;
  label: Localizable;
  prefix: string;
  private _namespace: Uri;
  modifiable: boolean;

  constructor(graph: any, context: any) {
    super('require', graph, context);
    this.id = graph['@id'];
    this.label = graph.label;
    this._namespace = graph['dcap:preferredXMLNamespaceName'];
    this.prefix = graph['dcap:preferredXMLNamespacePrefix'];
    this.modifiable = graph['@type'] === 'dcap:MetadataVocabulary';
  }

  get namespace() {
    return this._namespace;
  }

  set namespace(value) {
    this._namespace = value;
    this.id = _.trimRight(value, '#/');
  }

  serializationValues() {
    return {
      '@id': this.id,
      label: Object.assign({}, this.label),
      'dcap:preferredXMLNamespaceName': this.namespace,
      'dcap:preferredXMLNamespacePrefix': this.prefix
    }
  }
}


abstract class AbstractClass extends GraphNode implements Location {

  label: Localizable;
  comment: Localizable;

  constructor(graph: any, context: any) {
    super('class', graph, context);
    this.label = graph.label;
    this.comment = graph.comment;
  }

  abstract fullId(): Uri;
  abstract modelIowUrl(): Url;

  isClass() {
    return true;
  }

  isPredicate() {
    return false;
  }

  iowUrl() {
    return `${this.modelIowUrl()}&${this.type}=${encodeURIComponent(this.fullId())}`;
  }
}

export class ClassListItem extends AbstractClass {

  id: Uri;
  model: ModelListItem;

  constructor(graph: any, context: any) {
    super(graph, context);
    this.id = graph['@id'];
    this.model = new ModelListItem(graph.isDefinedBy, context);
  }

  fullId(): Uri {
    return this.id;
  }

  modelIowUrl() {
    return this.model.iowUrl();
  }
}

export class Class extends AbstractClass {

  curie: string;
  modelId: Uri;
  subClassOf: Uri;
  state: State;
  properties: Property[];
  subject: Concept;
  equivalentClasses: Curie[];
  unsaved: boolean = false;

  constructor(graph: any, context: any) {
    super(graph, context);
    this.curie = graph['@id'];
    this.modelId = graph.isDefinedBy;
    this.subClassOf = graph.subClassOf;
    this.state = graph.versionInfo;
    this.properties = _.map(normalizeAsArray(graph.property), property => new Property(property, context));
    if (graph.subject) {
      this.subject = new Concept(graph.subject, context);
    }
    this.equivalentClasses = normalizeAsArray<Curie>(graph.equivalentClass);
  }

  get id() {
    return this.fullId();
  }

  fullId(): Uri {
    if (this.curie) {
      return this.expandCurie(this.curie).uri;
    }
  }

  addProperty(property: Property): void {
    this.properties.push(property);
  }

  removeProperty(property: Property): void {
    _.remove(this.properties, property);
  }

  modelIowUrl(): RelativeUrl {
    return modelUrl(this.modelId);
  }

  clone(): Class {
    const serialization = this.serialize();
    return new Class(serialization['@graph'], serialization['@context']);
  }

  serializationValues() {
    return {
      '@id': this.curie,
      label: Object.assign({}, this.label),
      comment: Object.assign({}, this.comment),
      subClassOf: this.subClassOf,
      versionInfo: this.state,
      property: _.map(this.properties, property => property.serialize(true)),
      subject: this.subject && this.subject.serialize(true),
      equivalentClass: this.equivalentClasses.slice()
    }
  }
}

export class Property extends GraphNode {

  id: Uri;
  state: State;
  label: Localizable;
  comment: Localizable;
  example: string;
  dataType: string;
  valueClass: Uri;
  predicateCurie: string;
  index: number;

  constructor(graph: any, context: any) {
    super('property', graph, context);
    this.id = graph['@id'];
    this.state = graph.versionInfo;
    this.label = graph.label;
    this.comment = graph.comment;
    this.example = graph.example;
    this.dataType = graph.datatype;
    this.valueClass = graph.valueClass;
    this.predicateCurie = graph.predicate;
    this.index = graph['sh:index'];
  }

  get predicateId(): Uri {
    return this.expandCurie(this.predicateCurie).uri;
  }

  get glyphIconClass() {
    return glyphIconClassForType(this.dataType ? 'attribute' : this.valueClass ? 'association' : null);
  }

  serializationValues() {
    return {
      '@id': this.id,
      versionInfo: this.state,
      label: Object.assign({}, this.label),
      comment: Object.assign({}, this.comment),
      example: this.example,
      datatype: this.dataType,
      valueClass: this.valueClass,
      predicate: this.predicateCurie,
      'sh:index': this.index
    }
  }
}

abstract class AbstractPredicate extends GraphNode implements Location {

  label: Localizable;
  comment: Localizable;

  constructor(graph: any, context: any) {
    super(mapType(graph['@type']), graph, context);
    this.label = graph.label;
    this.comment = graph.comment;
  }

  abstract modelIowUrl(): RelativeUrl;
  abstract fullId(): Uri;

  get rawType() {
    return this.graph['@type'];
  }

  isClass() {
    return false;
  }

  isPredicate() {
    return true;
  }

  isAttribute() {
    return this.type =='attribute';
  }

  isAssociation() {
    return this.type =='association';
  }

  iowUrl(): RelativeUrl {
    return `${this.modelIowUrl()}&${this.type}=${encodeURIComponent(this.fullId())}`;
  }
}

export class PredicateListItem extends AbstractPredicate {

  id: Uri;
  model: ModelListItem;

  constructor(graph: any, context: any) {
    super(graph, context);
    this.id = graph['@id'];
    this.model = new ModelListItem(graph.isDefinedBy, context);
  }

  fullId(): Uri {
    return this.id;
  }

  modelIowUrl(): RelativeUrl {
    return this.model.iowUrl();
  }
}

export abstract class Predicate extends AbstractPredicate {

  curie: string;
  modelId: Uri;
  state: State;
  subPropertyOf: Uri;
  subject: Concept;
  equivalentProperties: Curie[];
  unsaved: boolean = false;

  constructor(graph: any, context: any) {
    super(graph, context);
    this.curie = graph['@id'];
    this.modelId = graph.isDefinedBy;
    this.state = graph.versionInfo;
    this.subPropertyOf = graph.subPropertyOf;
    if (graph.subject) {
      this.subject = new Concept(graph.subject, context);
    }
    this.equivalentProperties = normalizeAsArray<Curie>(graph.equivalentProperty);
  }

  get id() {
    return this.fullId();
  }

  abstract getRange(): any;

  fullId() {
    if (this.curie) {
      return this.expandCurie(this.curie).uri;
    }
  }

  modelIowUrl(): RelativeUrl {
    return modelUrl(this.modelId);
  }

  serializationValues() {
    return {
      '@id': this.curie,
      label: Object.assign({}, this.label),
      comment: Object.assign({}, this.comment),
      range: this.getRange(),
      versionInfo: this.state,
      subPropertyOf: this.subPropertyOf,
      subject: this.subject && this.subject.serialize(true),
      equivalentProperty: this.equivalentProperties.slice()
    }
  }
}

export class Association extends Predicate {

  valueClass: Uri;

  constructor(graph: any, context: any) {
    super(graph, context);
    this.valueClass = graph.range;
  }

  getRange() {
    return this.valueClass;
  }

  clone(): Association {
    const serialization = this.serialize();
    return new Association(serialization['@graph'], serialization['@context']);
  }

  serializationValues() {
    return Object.assign(super.serializationValues(), {
      range: this.valueClass
    });
  }
}

export class Attribute extends Predicate {

  dataType: string;

  constructor(graph: any, context: any) {
    super(graph, context);
    this.dataType = graph.range;
  }

  getRange() {
    return this.dataType;
  }

  clone(): Attribute {
    const serialization = this.serialize();
    return new Attribute(serialization['@graph'], serialization['@context']);
  }

  serializationValues() {
    return Object.assign(super.serializationValues(), {
      range: this.dataType
    });
  }
}

export class Concept extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  inScheme: Uri[];

  constructor(graph: any, context: any) {
    super('concept', graph, context);
    this.id = graph['@id'];
    this.label = graph.label || graph.prefLabel;
    this.comment = graph.comment || graph['rdfs:comment'];
    this.inScheme = _.map(normalizeAsArray<any>(graph.inScheme), scheme => scheme['@id'] || scheme.uri);
  }
}

export class ConceptSuggestion extends Concept {

  createdAt: string;
  creator: string;

  constructor(graph: any, context: any) {
    super(graph, context);
    this.createdAt = graph.atTime;
    this.creator = graph.wasAssociatedWith;
  }
}

export interface User {
  isLoggedIn(): boolean;
  isMemberOf(entity: AbstractModel|AbstractGroup): boolean;
  isMemberOfGroup(id: Uri): boolean;
  isAdminOf(entity: AbstractModel|AbstractGroup): boolean;
  isAdminOfGroup(id: Uri): boolean;
  name?: string;
}

export class DefaultUser extends GraphNode implements User {

  createdAt: string;
  modifiedAt: string;
  adminGroups: Uri[];
  memberGroups: Uri[];
  name: string;

  constructor(graph: any, context: any) {
    super('user', graph, context);
    this.createdAt = graph.created;
    this.modifiedAt = graph.modified;
    this.adminGroups = normalizeAsArray<Uri>(graph.isAdminOf);
    this.memberGroups = normalizeAsArray<Uri>(graph.isPartOf);
    this.name = graph.name;
  }

  isLoggedIn(): boolean {
    return this.graph['iow:login'];
  }

  isMemberOf(entity: Model|AbstractGroup) {
    return this.isMemberOfGroup(entity.groupId);
  }

  isMemberOfGroup(id: Uri) {
    return !!_.find(this.memberGroups, v => v === id);
  }

  isAdminOf(entity: Model|AbstractGroup) {
    return this.isAdminOfGroup(entity.groupId);
  }

  isAdminOfGroup(id: Uri) {
    return !!_.find(this.adminGroups, v => v === id);
  }
}

export class AnonymousUser implements User {
  isLoggedIn(): boolean {
    return false;
  }

  isMemberOf(entity: Model|AbstractGroup) {
    return false;
  }

  isMemberOfGroup(id: Uri) {
    return false;
  }

  isAdminOf(entity: Model|AbstractGroup) {
    return false;
  }

  isAdminOfGroup(id: Uri) {
    return false;
  }
}

export class SearchResult extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;

  constructor(graph: any, context: any) {
    super(mapType(graph['@type']), graph, context);
    this.id = graph['@id'];
    this.label = graph.label;
    this.comment = graph.comment;
  }

  iowUrl() {
    switch (this.type) {
      case 'group':
        return groupUrl(this.id);
      case 'model':
        return modelUrl(this.id);
      default:
        if (this.type) {
          return selectableUrl(this.id, this.type);
        }
    }
  }
}

export class Usage extends GraphNode {

  id: Uri;
  label: Localizable;
  modelId: Uri;
  referrers: Referrer[];

  constructor(graph: any, context: any) {
    super(mapType(graph['@type']), graph, context);
    this.id = graph['@id'];
    this.label = graph.label;
    this.modelId = graph.isDefinedBy;
    this.referrers = _.map(normalizeAsArray(graph.isReferencedBy), referrer => new Referrer(referrer, context));
  }
}

export class Referrer extends GraphNode {

  id: Uri;
  label: Localizable;
  type: Type;
  modelId: Uri;

  constructor(graph: any, context: any) {
    super(mapType(graph['@type']), graph, context);
    this.id = graph['@id'];
    this.label = graph.label;
    this.modelId = graph.isDefinedBy;
  }
}

function mapType(type: string): Type {
  for (const item of normalizeAsArray(type)) {
    switch (item) {
      case 'sh:ShapeClass':
        return 'class';
      case 'owl:DatatypeProperty':
        return 'attribute';
      case 'owl:ObjectProperty':
        return 'association';
      case 'owl:Ontology':
        return 'model';
      case 'foaf:Group':
        return 'group';
      case 'skos:Collection': // TODO what is this?
        return null;
      default:
      // continue
    }
  }

  throw new Error('No type found for: ' + type);
}

function groupUrl(id: Uri): RelativeUrl {
  return `/groups?urn=${encodeURIComponent(id)}`;
}

function modelUrl(id: Uri): RelativeUrl {
  return `/models?urn=${encodeURIComponent(id)}`;
}

function selectableUrl(id: Uri, type: Type): RelativeUrl {
  const [modelId] = id.split('#');
  return `${modelUrl(modelId)}&${type}=${encodeURIComponent(id)}`;
}

function renameProperty(obj: any, name: string, newName: string) {
  obj[newName] = obj[name];
  delete obj[name];
  return obj;
}

function frameData($log: angular.ILogService, data: any, frame: any): IPromise<any> {
  return jsonld.promises.frame(data, frame)
    .then((framed: any) => framed, (err: any) => {
      $log.error(frame);
      $log.error(data);
      $log.error(err.message);
      $log.error(err.details.cause);
    });
}

function frameAndMap<T extends GraphNode>($log: angular.ILogService, data: any, frame: any, entityFactory: EntityFactory<T>): IPromise<T> {
  return frameData($log, data, frame(data))
    .then(framed => {
      try {
        return entityFactory(framed['@graph'][0], framed['@context'])
      } catch (error) {
        $log.error(error);
        throw error;
      }
    });
}

function frameAndMapArray<T extends GraphNode>($log: angular.ILogService, data: any, frame: any, entityFactory: EntityFactory<T>): IPromise<T[]> {
  return frameData($log, data, frame(data))
    .then(framed => {
      try {
        return _.map(normalizeAsArray(framed['@graph']), element => entityFactory(element, framed['@context']))
      } catch (error) {
        $log.error(error);
        throw error;
      }
    });
}

export class EntityDeserializer {
  /* @ngInject */
  constructor(private $log: angular.ILogService) {
  }

  deserializeGroupList(data: any): IPromise<GroupListItem[]> {
    return frameAndMapArray(this.$log, data, frames.groupListFrame, (graph, context) => new GroupListItem(graph, context));
  }

  deserializeGroup(data: any): IPromise<Group> {
    return frameAndMap(this.$log, data, frames.groupFrame, (graph, context) => new Group(graph, context));
  }

  deserializeModelList(data: any): IPromise<ModelListItem[]> {
    return frameAndMapArray(this.$log, data, frames.modelListFrame, (graph, context) => new ModelListItem(graph, context));
  }

  deserializeModel(data: any): IPromise<Model> {
    return frameAndMap(this.$log, data, frames.modelFrame, (graph, context) => new Model(graph, context));
  }

  deserializeClassList(data: any): IPromise<ClassListItem[]> {
    return frameAndMapArray(this.$log, data, frames.classListFrame, (graph, context) => new ClassListItem(graph, context));
  }

  deserializeClass(data: any): IPromise<Class> {
    return frameAndMap(this.$log, data, frames.classFrame, (graph, context) => new Class(graph, context));
  }

  deserializeProperty(data: any): IPromise<Property> {
    return frameAndMap(this.$log, data, frames.propertyFrame, (graph, context) => new Property(graph, context));
  }

  deserializePredicateList(data: any): IPromise<PredicateListItem[]> {
    return frameAndMapArray(this.$log, data, frames.predicateListFrame, (graph, context) => new PredicateListItem(graph, context));
  }

  deserializePredicate(data: any): IPromise<Predicate> {
    return frameAndMap(this.$log, data, frames.predicateFrame, (graph, context) => {
      switch (mapType(graph['@type'])) {
        case 'association': return new Association(graph, context);
        case 'attribute': return new Attribute(graph, context);
        default: throw new Error('Incompatible type ' + graph['@type']);
      }
    });
  }

  deserializeConceptSuggestion(data: any): IPromise<ConceptSuggestion> {
    return frameAndMap(this.$log, data, frames.conceptSuggestionFrame, (graph, context) => new ConceptSuggestion(graph, context));
  }

  deserializeConceptSuggestions(data: any): IPromise<ConceptSuggestion[]> {
    return frameAndMapArray(this.$log, data, frames.conceptSuggestionFrame, (graph, context) => new ConceptSuggestion(graph, context));
  }

  deserializeConcept(data: any, id: Uri): IPromise<Concept> {
    return frameData(this.$log, data, frames.fintoConceptFrame(data, id))
      .then(framed => new Concept(renameProperty(framed.graph[0], 'uri', '@id'), framed['@context']));
  }

  deserializeRequire(data: any): IPromise<Require> {
    return frameAndMap(this.$log, data, frames.requireFrame, (graph, context) => new Require(graph, context));
  }

  deserializeRequires(data: any): IPromise<Require[]> {
    return frameAndMapArray(this.$log, data, frames.requireFrame, (graph, context) => new Require(graph, context));
  }

  deserializeUser(data: any): IPromise<User> {
    return frameAndMap(this.$log, data, frames.userFrame, (graph, context) => new DefaultUser(graph, context));
  }

  deserializeSearch(data: any): IPromise<SearchResult[]> {
    return frameAndMapArray(this.$log, data, frames.searchResultFrame, (graph, context) => new SearchResult(graph, context))
  }

  deserializeClassVisualization(data: any): IPromise<any> {
    return frameData(this.$log, data, frames.classVisualizationFrame(data));
  }

  deserializeUsage(data: any): IPromise<Usage> {
    return frameAndMap(this.$log, data, frames.usageFrame, (graph, context) => graph ? new Usage(graph, context) : null);
  }
}
