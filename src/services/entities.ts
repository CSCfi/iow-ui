import IPromise = angular.IPromise;
import * as _ from 'lodash';
import * as frames from './frames';
import * as moment from 'moment';
import {
  glyphIconClassForType,
  normalizeAsArray,
  normalizeSelectionType,
  containsAny,
  normalizeModelType,
  hasLocalization, normalizeClassType, normalizePredicateType, normalizeReferrerType, identity
} from './utils';
import Moment = moment.Moment;
import split = require("core-js/fn/symbol/split");
import { Frame } from './frames';
import { FrameFn } from './frames';
import { mapType, reverseMapType } from './typeMapping';
import { config } from '../config';
import { Uri } from './uri';
export { Uri } from './uri';

const jsonld: any = require('jsonld');

const isoDateFormat = 'YYYY-MM-DDTHH:mm:ssz';

export type EditableEntity = Class|Association|Attribute|Model|Group;
export type Localizable = { [language: string]: string; }
export type Url = string;
export type Urn = string;
export type RelativeUrl = string;
export type UserLogin = string;

export type Type = string
//export type Type = 'class'
//                 | 'shape'
//                 | 'attribute'
//                 | 'association'
//                 | 'model'
//                 | 'profile'
//                 | 'group'
//                 | 'library'
//                 | 'constraint'
//                 | 'user'
//                 | 'concept';
export type State = string;
//export type State = 'Unstable'
//                  | 'Draft'
//                  | 'Recommendation'
//                  | 'Deprecated';
export type ConstraintType = string;
//export type ConstraintType = 'or' | 'and' | 'not';


interface EntityConstructor<T extends GraphNode> {
  new(graph: any, context: any, frame: any): T;
}

type EntityFactory<T extends GraphNode> = (framedData: any) => EntityConstructor<T>;

export function isLocalizable(obj: any): obj is Localizable {
  return typeof obj === 'object';
}

export interface Location {
  localizationKey?: string;
  label?: Localizable;
  iowUrl?(): string;
}

export abstract class GraphNode {

  type: Type[];

  constructor(public graph: any, public context: any, public frame: any) {
    this.type = mapGraphTypeObject(graph['@type']);
  }

  isOfType(type: Type) {
    return containsAny(this.type, [type]);
  }

  get glyphIconClass(): any {
    return glyphIconClassForType(this.type);
  }

  serializationValues(): {} {
    return {};
  }

  addKnownModelsToContext(model: Model) {
    model.expandContextWithKnownModels(this.context);
  }

  expandContext(context: any) {
    Object.assign(context, this.context);
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

export class DefinedBy extends GraphNode {

  id: Uri;
  label: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    // FIXME: when api returns coherent data get rid of this mangling
    if (typeof graph === 'string' || graph instanceof String) {
      const str = (graph instanceof String) ? graph.valueOf() : graph;
      this.id = new Uri(str, context);
      this.label = deserializeLocalizable({'fi': str, 'en': str });

    } else if (typeof graph === 'object') {
      this.id = new Uri(graph['@id'], context);
      this.label = deserializeLocalizable(graph.label);
    } else {
      throw new Error('Unsupported is defined sub-graph');
    }
  }
}

export abstract class AbstractGroup extends GraphNode implements Location {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  homepage: Url;
  normalizedType: Type = 'group';
  selectionType: Type = 'group';

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.homepage = graph.homepage;
  }

  get groupId() {
    return this.id;
  }

  iowUrl() {
    return internalUrl(this.id, this.type);
  }
}

export class GroupListItem extends AbstractGroup {
  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export class Group extends AbstractGroup {

  unsaved: boolean;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }

  clone(): Group {
    const serialization = this.serialize();
    const result =  new Group(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    return result;
  }
}

abstract class AbstractModel extends GraphNode implements Location {

  id: Uri;
  label: Localizable;
  normalizedType: Type;
  selectionType: Type;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.normalizedType = normalizeModelType(this.type);
    this.selectionType = normalizeSelectionType(this.type);
  }

  iowUrl() {
    return internalUrl(this.id, this.type);
  }
}

export class ModelListItem extends AbstractModel {
  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export class Model extends AbstractModel {

  comment: Localizable;
  state: State;
  references: Reference[];
  requires: Require[];
  unsaved: boolean = false;
  namespace: Url;
  prefix: string;
  group: GroupListItem;
  version: Urn;
  rootClass: Uri;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.comment = deserializeLocalizable(graph.comment);
    this.state = graph.versionInfo;
    this.namespace = graph['preferredXMLNamespaceName'];
    this.prefix = graph['preferredXMLNamespacePrefix'];
    if (!graph.isPartOf['@type']) {
      // TODO: Shouldn't be needed but in all cases API doesn't return it
      graph.isPartOf['@type'] = 'foaf:Group';
    }
    this.group = new GroupListItem(graph.isPartOf, context, frame);
    this.references = deserializeEntityList(graph.references, context, frame, Reference);
    this.requires = deserializeEntityList(graph.requires, context, frame, Require);
    this.version = graph.identifier;
    if (graph.rootResource) {
      this.rootClass = new Uri(graph.rootResource, context);
    }
    this.expandContextWithKnownModels(this.context);
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

  expandContextWithKnownModels(context: any) {
    Object.assign(context, this.knownModels());
  }

  asDefinedBy() {
    return new DefinedBy({'@id': this.id.uri, '@type': reverseMapTypeObject(this.type), label: this.label}, this.context, this.frame);
  }

  findModelPrefixForNamespace(namespace: Url)  {
    const knownModels = this.knownModels();
    for (const prefix of Object.keys(knownModels)) {
      if (namespace === knownModels[prefix]) {
        return prefix;
      }
    }
  }

  knownModels() {
    const result: {[prefix: string]: string} = {};

    result[this.prefix] = this.namespace;

    for (const require of this.requires) {
      if (!require.modifiable) {
        result[require.prefix] = require.namespace;
      }
    }

    return result;
  }

  linkTo(type: Type|Type[], id: Uri) {
    const typeArray: Type[] = normalizeAsArray<Type>(type);

    if (id) {
      if (!id.isUrn()) {
        const isExternalUri = !this.findModelPrefixForNamespace(id.namespace);
        return isExternalUri ? id.url : internalUrl(id, typeArray);
      }
    }
  }

  clone(): Model {
    const serialization = this.serialize();
    const result = new Model(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    return result;
  }

  serializationValues(): any {
    this.expandContextWithKnownModels(this.context);

    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      versionInfo: this.state,
      references: serializeEntityList(this.references),
      requires: serializeEntityList(this.requires),
      identifier: this.version,
      rootResource: this.rootClass && this.rootClass.uri
    }
  }
}

export class Reference extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  vocabularyId: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.vocabularyId = graph.identifier;
    this.id = new Uri(graph['@id']);
    this.label = deserializeLocalizable(graph.title);
    this.comment = deserializeLocalizable(graph.comment);
  }

  get href() {
    return config.fintoUrl + this.vocabularyId;
  }
}

export class Require extends GraphNode {

  id: Uri;
  label: Localizable;
  private _prefix: string;
  private _namespace: Url;
  modifiable: boolean;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this._namespace = graph['preferredXMLNamespaceName'];
    this.prefix = graph['preferredXMLNamespacePrefix'];
    this.modifiable = graph['@type'] === 'dcap:MetadataVocabulary';
  }

  get prefix() {
    return this._prefix;
  }

  set prefix(prefix) {
    this._prefix = prefix;
    this.id = new Uri(this.id.uri, { [prefix]: this.namespace });
  }

  get namespace() {
    return this._namespace;
  }

  set namespace(ns) {
    this._namespace = ns;
    this.id = new Uri(_.trimRight(ns, '#/'), { [this.prefix]: ns });
  }

  serializationValues() {
    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      'preferredXMLNamespaceName': this.namespace,
      'preferredXMLNamespacePrefix': this.prefix
    }
  }
}


abstract class AbstractClass extends GraphNode implements Location {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  selectionType: Type;
  normalizedType: Type;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.selectionType = normalizeSelectionType(this.type);
    this.normalizedType = normalizeClassType(this.type);
  }

  isClass() {
    return true;
  }

  isPredicate() {
    return false;
  }

  iowUrl() {
    return internalUrl(this.id, this.type);
  }
}

export class ClassListItem extends AbstractClass {

  definedBy: DefinedBy;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.definedBy = new DefinedBy(graph.isDefinedBy, context, frame);
  }

  isSpecializedClass() {
    return this.definedBy.isOfType('profile');
  }
}

export class VisualizationClass extends AbstractClass {

  properties: Property[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.properties = deserializeEntityList(graph.property, context, frame, Property);
  }
}

export class Class extends AbstractClass {

  subClassOf: Uri;
  scopeClass: Uri;
  state: State;
  definedBy: DefinedBy;
  properties: Property[];
  subject: FintoConcept|ConceptSuggestion;
  equivalentClasses: Uri[];
  constraint: Constraint;
  version: Urn;

  unsaved: boolean = false;
  generalizedFrom: Class;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    if (graph.subClassOf) {
      this.subClassOf = new Uri(graph.subClassOf, context);
    }
    if (graph.scopeClass) {
      this.scopeClass = new Uri(graph.scopeClass, context);
    }
    this.state = graph.versionInfo;
    this.definedBy = new DefinedBy(graph.isDefinedBy, context, frame);
    this.properties = deserializeEntityList(graph.property, context, frame, Property);
    if (graph.subject) {
      this.subject = isUuidUrn(graph.subject['@id'])
        ? new ConceptSuggestion(graph.subject, context, frame)
        : new FintoConcept(graph.subject, context, frame);
    }
    this.equivalentClasses = deserializeList(graph.equivalentClass, equivalentClass => new Uri(equivalentClass, context));
    this.constraint = new Constraint(graph.constraint || {}, context, frame);
    this.version = graph.identifier;
  }

  isSpecializedClass() {
    return this.definedBy.isOfType('profile');
  }

  generalize(model: Model, properties: Property[]) {
    const newClass = this.clone();
    newClass.unsaved = true;
    newClass.addKnownModelsToContext(model);
    newClass.id = model.id.withName(this.id.name);
    newClass.generalizedFrom = this;
    newClass.definedBy = model.asDefinedBy();
    newClass.properties = [];

    for(const property of properties) {
      newClass.addProperty(property.clone());
    }

    return newClass;
  }

  addProperty(property: Property): void {
    property.index = this.properties.length;
    this.properties.push(property);
  }

  removeProperty(property: Property): void {
    _.remove(this.properties, property);
  }

  clone(): Class {
    const serialization = this.serialize();
    const result = new Class(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    result.generalizedFrom = this.generalizedFrom;
    return result;
  }

  serializationValues() {
    return {
      '@id': this.id.uri,
      '@type': reverseMapTypeObject(this.type),
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      subClassOf: this.subClassOf && this.subClassOf.uri,
      scopeClass: this.scopeClass && this.scopeClass.uri,
      versionInfo: this.state,
      isDefinedBy: this.definedBy.serialize(true),
      property: serializeEntityList(this.properties),
      subject: serializeOptional(this.subject),
      equivalentClass: serializeList(this.equivalentClasses, equivalentClass => equivalentClass.uri),
      constraint: serializeOptional(this.constraint, (constraint) => constraint.items.length > 0 || hasLocalization(constraint.comment)),
      identifier: this.version
    };
  }
}

export class Constraint extends GraphNode {

  constraint: ConstraintType;
  items: ConstraintListItem[];
  comment: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    const and = deserializeEntityList(graph.and, context, frame, ConstraintListItem);
    const or = deserializeEntityList(graph.or, context, frame, ConstraintListItem);
    const not = deserializeEntityList(graph.not, context, frame, ConstraintListItem);

    if (and.length > 0) {
      this.constraint = 'and';
      this.items = and;
    } else if (or.length > 0) {
      this.constraint = 'or';
      this.items = or;
    } else if (not.length > 0) {
      this.constraint = 'not';
      this.items = not;
    } else {
      this.constraint = 'or';
      this.items = [];
    }

    this.comment = deserializeLocalizable(graph.comment);
  }

  isVisible() {
    return this.items.length > 0 || this.comment;
  }

  addItem(shape: Class) {
    const graph = {
      '@id': shape.id.uri,
      label: shape.label
    };

    this.items.push(new ConstraintListItem(graph, this.context, this.frame));
  }

  removeItem(removedItem: ConstraintListItem) {
    _.remove(this.items, item => item === removedItem);
  }

  serializationValues() {
    function mapConstraintType(constraint: ConstraintType) {
      switch (constraint) {
        case 'or':
          return 'sh:AbstractOrNodeConstraint';
        case 'and':
          return 'sh:AbstractAndNodeConstraint';
        case 'not':
          return 'sh:AbstractNotNodeConstraint';
      }
    }

    const items = serializeEntityList(this.items);

    return {
      '@type': mapConstraintType(this.constraint),
      comment: serializeLocalizable(this.comment),
      and: this.constraint === 'and' ? items && serializeList(items) : null,
      or: this.constraint === 'or' ? items && serializeList(items) : null,
      not: this.constraint === 'not' ? items && serializeList(items) : null
    };
  }
}

export class ConstraintListItem extends GraphNode {

  shapeId: Uri;
  label: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.shapeId = new Uri(graph['@id'], context);
    this.label = graph.label;
  }

  serializationValues() {
    return {
      '@id': this.shapeId.uri
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
  predicate: Uri;
  index: number;
  minCount: number;
  maxCount: number;
  pattern: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.state = graph.versionInfo;
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.example = graph.example;
    this.dataType = graph.datatype;
    if (graph.valueShape) {
      this.valueClass = new Uri(graph.valueShape, context);
    }
    this.predicate = new Uri(graph.predicate, context);
    this.index = graph.index;
    this.minCount = graph.minCount;
    this.maxCount = graph.maxCount;
    this.pattern = graph.pattern;
  }

  hasAssociationTarget() {
    return !!this.valueClass;
  }

  get glyphIconClass() {
    return glyphIconClassForType(this.dataType ? ['attribute'] : this.valueClass ? ['association'] : []);
  }

  clone(): Property {
    const serialization = this.serialize();
    return new Property(serialization['@graph'], serialization['@context'], this.frame);
  }

  serializationValues() {
    return {
      '@id': this.id.uri,
      versionInfo: this.state,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      example: this.example,
      datatype: this.dataType,
      valueShape: this.valueClass && this.valueClass.uri,
      predicate: this.predicate.uri,
      index: this.index,
      minCount: this.minCount,
      maxCount: this.maxCount,
      pattern: this.pattern
    }
  }
}

abstract class AbstractPredicate extends GraphNode implements Location {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  definedBy: DefinedBy;
  normalizedType: Type;
  selectionType: Type;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.definedBy = new DefinedBy(graph.isDefinedBy, context, frame);
    this.normalizedType = normalizePredicateType(this.type);
    this.selectionType = normalizeSelectionType(this.type);
  }

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
    return this.isOfType('attribute');
  }

  isAssociation() {
    return this.isOfType('association');
  }

  iowUrl(): RelativeUrl {
    return internalUrl(this.id, this.type);
  }
}

export class PredicateListItem extends AbstractPredicate {

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export abstract class Predicate extends AbstractPredicate {

  state: State;
  subPropertyOf: Uri;
  subject: FintoConcept|ConceptSuggestion;
  equivalentProperties: Uri[];
  unsaved: boolean = false;
  version: Urn;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.state = graph.versionInfo;
    if (graph.subPropertyOf) {
      this.subPropertyOf = new Uri(graph.subPropertyOf, context);
    }
    if (graph.subject) {
      this.subject = isUuidUrn(graph.subject['@id'])
        ? new ConceptSuggestion(graph.subject, context, frame)
        : new FintoConcept(graph.subject, context, frame);
    }
    this.equivalentProperties = deserializeList(graph.equivalentProperty, equivalentProperty => new Uri(equivalentProperty, context));
    this.version = graph.identifier;
  }

  abstract getRange(): any;

  serializationValues() {
    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      range: this.getRange(),
      versionInfo: this.state,
      subPropertyOf: this.subPropertyOf && this.subPropertyOf.uri,
      subject: serializeOptional(this.subject),
      equivalentProperty: serializeList(this.equivalentProperties, equivalentProperty => equivalentProperty.uri),
      identifier: this.version
    }
  }
}

export class Association extends Predicate {

  valueClass: Uri;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    if (graph.range) {
      this.valueClass = new Uri(graph.range, context);
    }
  }

  getRange() {
    return this.valueClass;
  }

  clone(): Association {
    const serialization = this.serialize();
    const result = new Association(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    return result;
  }

  serializationValues() {
    return Object.assign(super.serializationValues(), {
      range: this.valueClass && this.valueClass.uri
    });
  }
}

export class Attribute extends Predicate {

  dataType: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.dataType = graph.range;
  }

  getRange() {
    return this.dataType;
  }

  clone(): Attribute {
    const serialization = this.serialize();
    const result = new Attribute(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    return result;
  }

  serializationValues() {
    return Object.assign(super.serializationValues(), {
      range: this.dataType
    });
  }
}

export class FintoConcept extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  inScheme: Url[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.prefLabel);
    this.comment = deserializeLocalizable(graph.comment || graph.definition);
    this.inScheme = deserializeList<Url>(graph.inScheme);
  }
}

export class ConceptSuggestion extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  inScheme: Url[];
  createdAt: Moment;
  creator: UserLogin;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.prefLabel);
    this.comment = deserializeLocalizable(graph.definition);
    this.inScheme = deserializeList<Url>(graph.inScheme);
    this.createdAt = deserializeDate(graph.atTime);
    this.creator = deserializeUserLogin(graph.wasAssociatedWith);

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

  createdAt: Moment;
  modifiedAt: Moment;
  adminGroups: Uri[];
  memberGroups: Uri[];
  name: string;
  login: UserLogin;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.createdAt = deserializeDate(graph.createdAt);
    this.modifiedAt = deserializeOptionalDate(graph.modified);
    this.adminGroups = deserializeList<Uri>(graph.isAdminOf, admin => new Uri(admin, context));
    this.memberGroups = deserializeList<Uri>(graph.isPartOf, part => new Uri(part, context));
    this.name = graph.name;
    this.login = deserializeUserLogin(graph['@id']);
  }

  isLoggedIn(): boolean {
    return this.graph['iow:login'];
  }

  isMemberOf(entity: Model|AbstractGroup) {
    return this.isMemberOfGroup(entity.groupId);
  }

  isMemberOfGroup(id: Uri) {
    return !!_.find(this.memberGroups, v => v.equals(id));
  }

  isAdminOf(entity: Model|AbstractGroup) {
    return this.isAdminOfGroup(entity.groupId);
  }

  isAdminOfGroup(id: Uri) {
    return !!_.find(this.adminGroups, v => v.equals(id));
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

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
  }

  iowUrl() {
    return internalUrl(this.id, this.type);
  }
}

export class Usage extends GraphNode {

  id: Uri;
  label: Localizable;
  definedBy: DefinedBy;
  referrers: Referrer[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.definedBy = deserializeOptional(graph.isDefinedBy, context, frame, DefinedBy);
    this.referrers = deserializeEntityList(graph.isReferencedBy, context, frame, Referrer);
  }
}

export class Referrer extends GraphNode {

  id: Uri;
  label: Localizable;
  definedBy: DefinedBy;
  normalizedType: Type;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.definedBy = deserializeOptional(graph.isDefinedBy, context, frame, DefinedBy);
    this.normalizedType = normalizeReferrerType(this.type);
  }

  iowUrl() {
    return internalUrl(this.id, this.type);
  }
}

export class Activity extends GraphNode {

  id: Uri;
  createdAt: Moment;
  lastModifiedBy: UserLogin;
  versions: Entity[];
  latestVersion: Urn;
  private versionIndex: Map<Urn, number>;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.createdAt = deserializeDate(graph.startedAtTime);
    this.lastModifiedBy = deserializeUserLogin(graph.wasAttributedTo);
    this.versions = deserializeEntityList(graph.generated, context, frame, Entity).sort((lhs, rhs) => compareDates(rhs.createdAt, lhs.createdAt));
    this.versionIndex = indexById(this.versions);
    this.latestVersion = graph.used;
  }

  getVersion(version: Urn): Entity {
    const index = this.versionIndex.get(version);
    return index && this.versions[index];
  }

  get latest(): Entity {
    return this.getVersion(this.latestVersion);
  }
}

export class Entity extends GraphNode {

  id: Urn;
  createdAt: Moment;
  createdBy: UserLogin;
  previousVersion: Urn;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.createdAt = deserializeDate(graph.generatedAtTime);
    this.createdBy = deserializeUserLogin(graph.wasAttributedTo);
    this.previousVersion = graph.wasRevisionOf;
  }

  getPrevious(activity: Activity): Entity {
    return this.previousVersion && activity.getVersion(this.previousVersion);
  }
}

function reportErrorWithStack(error: string, graph: any) {
  console.log(error);
  console.log(new Error().stack);
  console.log(graph);
}

function isUuidUrn(s: string) {
  return s && s.startsWith('urn:uuid');
}

function compareDates(lhs: Moment, rhs: Moment) {
  if (lhs.isAfter(rhs)) {
    return 1;
  } else if (lhs.isBefore(rhs)) {
    return -1;
  } else {
    return 0;
  }
}

function indexById<T extends {id: Urn}>(items: T[]): Map<Urn, number> {
  return new Map(items.map<[Urn, number]>((item: T, index: number) => [item.id, index]));
}

function serializeOptional<T extends GraphNode>(entity: T, isDefined: (entity: T) => boolean = (entity: T) => !!entity) {
  return isDefined(entity) ? entity.serialize(true) : null;
}

function deserializeOptional<T extends GraphNode>(graph: any, context: any, frame: any, entity: EntityConstructor<T>): T {
  if (graph) {
    return new entity(graph, context,frame);
  } else {
    return null;
  }
}

function serializeEntityList(list: GraphNode[]) {
  if (list.length === 0) {
    return null;
  }
  return _.map(list, listItem => listItem.serialize(true));
}

function deserializeEntityList<T extends GraphNode>(list: any, context: any, frame: any, entity: EntityConstructor<T>): T[] {
  return _.map(normalizeAsArray(list), obj => new entity(obj, context, frame));
}

function serializeList<T>(list: any[], mapper: (obj: any) => T = identity) {
  if (list.length === 0) {
    return null;
  }

  return _.map(list, mapper);
}

function deserializeList<T>(list: any, mapper: (obj: any) => T = identity) {
  return _.map(normalizeAsArray<T>(list), mapper);
}

function serializeLocalizable(localizable: Localizable) {
  return Object.assign({}, localizable);
}

function deserializeLocalizable(localizable: any) {
  return localizable;
}

function deserializeDate(date: any) {
  return date && moment(date, isoDateFormat);
}

function deserializeOptionalDate(date: any) {
  return date && deserializeDate(date);
}

function deserializeUserLogin(userName: string): UserLogin {
  return userName && userName.substring('mailto:'.length);
}

function mapGraphTypeObject(type: string|string[]): Type[] {
  return _.chain(normalizeAsArray(type))
    .map(mapType)
    .reject(type => !type)
    .value();
}

function reverseMapTypeObject(type: Type[]): string[] {
  return _.chain(normalizeAsArray(type))
    .map(reverseMapType)
    .reject(type => !type)
    .value();
}

function modelUrl(id: string): RelativeUrl {
  return `/model?urn=${encodeURIComponent(id)}`;
}

export function internalUrl(id: Uri, type: Type[]) {
  if (id) {
    if (containsAny(type, ['model', 'profile'])) {
      return modelUrl(id.uri);
    } else if (containsAny(type, ['group'])) {
      return `/group?urn=${encodeURIComponent(id.uri)}`;
    } else if (containsAny(type, ['association', 'attribute'])) {
      return `${modelUrl(id.namespaceId)}&${normalizeSelectionType(type)}=${encodeURIComponent(id.uri)}`;
    } else if (containsAny(type, ['class', 'shape'])) {
      return `${modelUrl(id.namespaceId)}&class=${encodeURIComponent(id.uri)}`;
    } else {
      throw new Error('Unsupported type for url: ' + type);
    }
  }
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

function isFrameFunction(f: Frame|FrameFn): f is FrameFn {
  return typeof f === 'function';
}

function frameAndMap<T extends GraphNode>($log: angular.ILogService, data: any, frame: Frame|FrameFn, entityFactory: EntityFactory<T>): IPromise<T> {
  const frameObject = isFrameFunction(frame) ? frame(data) : frame;
  return frameData($log, data, frameObject)
    .then(framed => {
      try {
        // TODO: flag for mandatory and throw error if set
        if (framed['@graph'].length === 0) {
          return null;
        } else {
          const entity: EntityConstructor<T> = entityFactory(framed);
          return new entity(framed['@graph'][0], framed['@context'], frameObject);
        }
      } catch (error) {
        $log.error(error);
        throw error;
      }
    });
}

function frameAndMapArray<T extends GraphNode>($log: angular.ILogService, data: any, frame: Frame|FrameFn, entityFactory: EntityFactory<T>): IPromise<T[]> {
  const frameObject = isFrameFunction(frame) ? frame(data) : frame;
  return frameData($log, data, frameObject)
    .then(framed => {
      try {
        const entity: EntityConstructor<T> = entityFactory(framed);
        return _.map(normalizeAsArray(framed['@graph']), element => new entity(element, framed['@context'], frameObject));
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
    return frameAndMapArray(this.$log, data, frames.groupListFrame, (framedData) => GroupListItem);
  }

  deserializeGroup(data: any): IPromise<Group> {
    return frameAndMap(this.$log, data, frames.groupFrame, (framedData) => Group);
  }

  deserializeModelList(data: any): IPromise<ModelListItem[]> {
    return frameAndMapArray(this.$log, data, frames.modelListFrame, (framedData) => ModelListItem);
  }

  deserializeModel(data: any): IPromise<Model> {
    return frameAndMap(this.$log, data, frames.modelFrame, (framedData) => Model);
  }

  deserializeClassList(data: any): IPromise<ClassListItem[]> {
    return frameAndMapArray(this.$log, data, frames.classListFrame, (framedData) => ClassListItem);
  }

  deserializeClass(data: any): IPromise<Class> {
    return frameAndMap(this.$log, data, frames.classFrame, (framedData) => Class);
  }

  deserializeProperty(data: any): IPromise<Property> {
    return frameAndMap(this.$log, data, frames.propertyFrame, (framedData) => Property);
  }

  deserializePredicateList(data: any): IPromise<PredicateListItem[]> {
    return frameAndMapArray(this.$log, data, frames.predicateListFrame, (framedData) => PredicateListItem);
  }

  deserializePredicate(data: any): IPromise<Predicate> {
    const entityFactory: EntityFactory<Predicate> = (framedData) => {
      const types = mapGraphTypeObject(framedData['@graph'][0]['@type']);

      if (containsAny(types, ['association'])) {
        return Association;
      } else if (containsAny(types, ['attribute'])) {
        return Attribute;
      } else {
        throw new Error('Incompatible type: ' + types.join());
      }
    };

    return frameAndMap(this.$log, data, frames.predicateFrame, entityFactory);
  }

  deserializeConceptSuggestion(data: any): IPromise<ConceptSuggestion> {
    return frameAndMap(this.$log, data, frames.iowConceptFrame, (framedData) => ConceptSuggestion);
  }

  deserializeConceptSuggestions(data: any): IPromise<ConceptSuggestion[]> {
    return frameAndMapArray(this.$log, data, frames.iowConceptFrame, (framedData) => ConceptSuggestion);
  }

  deserializeFintoConcept(data: any, id: Url): IPromise<FintoConcept> {
    return frameAndMap(this.$log, data, frames.fintoConceptFrame(data, id), (framedData) => FintoConcept);
  }

  deserializeRequire(data: any): IPromise<Require> {
    return frameAndMap(this.$log, data, frames.requireFrame, (framedData) => Require);
  }

  deserializeRequires(data: any): IPromise<Require[]> {
    return frameAndMapArray(this.$log, data, frames.requireFrame, (framedData) => Require);
  }

  deserializeUser(data: any): IPromise<User> {
    return frameAndMap(this.$log, data, frames.userFrame, (framedData) => DefaultUser);
  }

  deserializeSearch(data: any): IPromise<SearchResult[]> {
    return frameAndMapArray(this.$log, data, frames.searchResultFrame, (framedData) => SearchResult)
  }

  deserializeClassVisualization(data: any): IPromise<any> {
    return frameAndMapArray(this.$log, data, frames.classVisualizationFrame, (framedData) => VisualizationClass)
  }

  deserializeUsage(data: any): IPromise<Usage> {
    return frameAndMap(this.$log, data, frames.usageFrame, (framedData) => Usage);
  }

  deserializeVersion(data: any): IPromise<Activity> {
    return frameAndMap(this.$log, data, frames.versionFrame, (framedData) => Activity);
  }
}
