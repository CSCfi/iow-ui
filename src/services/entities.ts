import IPromise = angular.IPromise;
import * as _ from 'lodash';
import * as frames from './frames';
import * as moment from 'moment';
import {
  glyphIconClassForType,
  normalizeAsArray,
  splitCurie,
  normalizeSelectionType,
  containsAny,
  normalizeModelType,
  splitNamespace,
  hasLocalization, normalizeClassType, normalizePredicateType, normalizeReferrerType
} from './utils';
import Moment = moment.Moment;
import split = require("core-js/fn/symbol/split");

const jsonld: any = require('jsonld');

const isoDateFormat = 'YYYY-MM-DDTHH:mm:ssz';

export type EditableEntity = Class|Association|Attribute|Model|Group;
export type Localizable = { [language: string]: string; }
export type Uri = string;
export type Url = string;
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

export type Curie = string;
//export class Curie {
//  constructor(private ns: string, public prefix: string, public value: string) {
//  }
//
//  get uri(): string {
//    return this.ns + this.value;
//  }
//}

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

  addNamespaceToContext(model: Model) {
    Object.assign(this.context, {[model.prefix]: model.namespace});
  }

  expandContext(data: any) {
    Object.assign(data['@context'], this.context);
    return data;
  }

  expandCurie(curie: Curie) {
    if (curie) {
      const split = splitCurie(curie);
      if (split) {
        const namespace = this.context[split.prefix];
        if (namespace) {
          return new ExpandedCurie(namespace, split.value);
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

export class DefinedBy extends GraphNode {

  id: Uri;
  label: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(fixIsDefinedBy(graph), context, frame);
    this.id = this.graph['@id'];
    this.label = deserializeLocalizable(this.graph.label);
  }
}

export abstract class AbstractGroup extends GraphNode implements Location {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  homepage: Uri;
  normalizedType: Type = 'group';
  selectionType: Type = 'group';

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.homepage = graph.homepage;
  }

  get groupId() {
    return this.id;
  }

  iowUrl() {
    return url(this.id, this.type);
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
    this.id = graph['@id'];
    this.label = deserializeLocalizable(graph.label);
    this.normalizedType = normalizeModelType(this.type);
    this.selectionType = normalizeSelectionType(this.type);
  }

  iowUrl() {
    return url(this.id, this.type);
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
  namespace: Uri;
  prefix: string;
  group: GroupListItem;
  version: Uri;
  rootClass: Curie;

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
    this.rootClass = graph.rootResource;
    this.copyNamespacesFromRequires();
  }

  get groupId() {
    return this.group.id;
  }

  get rootClassUri(): Uri {
    return this.expandCurie(this.rootClass).uri;
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

  asDefinedBy() {
    return new DefinedBy({'@id': this.id, '@type': reverseMapTypeObject(this.type), label: this.label}, this.context, this.frame);
  }

  findModelPrefixForNamespace(namespace: Uri)  {
    if (this.namespace === namespace) {
      return this.prefix;
    } else {
      const require =  _.find(this.requires, req => req.namespace === namespace);
      if (require) {
        return require.prefix;
      }
    }
  }

  idToCurie(id: Uri): Curie {
    const {namespace, idName} = splitNamespace(id);
    const prefix = this.findModelPrefixForNamespace(namespace);

    if (!prefix) {
      throw new Error('Cannot find prefix for namespace: ' + namespace);
    }

    return prefix + ':' + idName;
  }

  linkTo(type:Type|Type[], id:Uri|Curie) {
    const typeArray: Type[] = normalizeAsArray<Type>(type);

    if (id) {
      const expanded = this.expandCurie(id);
      if (expanded) {
        if (!this.findModelPrefixForNamespace(expanded.namespace)) {
          return expanded.uri;
        } else {
          return url(expanded.uri, typeArray);
        }
      } else {
        if (!(this.findModelPrefixForNamespace((id + '#') || this.findModelPrefixForNamespace(id + '/')))) {
          return id;
        } else {
          return url(id, typeArray);
        }
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
    this.copyNamespacesFromRequires();

    return {
      '@id': this.id,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      versionInfo: this.state,
      references: serializeEntityList(this.references),
      requires: serializeEntityList(this.requires),
      identifier: this.version,
      rootResource: this.rootClass
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
    this.id = graph['@id'];
    this.label = deserializeLocalizable(graph.title);
    this.comment = deserializeLocalizable(graph.comment);
  }
}

export class Require extends GraphNode {

  id: Uri;
  label: Localizable;
  prefix: string;
  private _namespace: Uri;
  modifiable: boolean;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.label = deserializeLocalizable(graph.label);
    this._namespace = graph['preferredXMLNamespaceName'];
    this.prefix = graph['preferredXMLNamespacePrefix'];
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
      label: serializeLocalizable(this.label),
      'preferredXMLNamespaceName': this.namespace,
      'preferredXMLNamespacePrefix': this.prefix
    }
  }
}


abstract class AbstractClass extends GraphNode implements Location {

  label: Localizable;
  comment: Localizable;
  selectionType: Type;
  normalizedType: Type;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.selectionType = normalizeSelectionType(this.type);
    this.normalizedType = normalizeClassType(this.type);
  }

  abstract fullId(): Uri;

  isClass() {
    return true;
  }

  isPredicate() {
    return false;
  }

  iowUrl() {
    return url(this.fullId(), this.type);
  }
}

export class ClassListItem extends AbstractClass {

  id: Uri;
  definedBy: DefinedBy;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.definedBy = new DefinedBy(graph.isDefinedBy, context, frame);
  }

  fullId(): Uri {
    return this.id;
  }

  isSpecializedClass() {
    return this.definedBy.isOfType('profile');
  }
}

export class VisualizationClass extends AbstractClass {

  id: Uri;
  properties: Property[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.properties = deserializeEntityList(graph.property, context, frame, Property);
  }

  fullId(): Uri {
    return this.id;
  }
}

export class Class extends AbstractClass {

  curie: string;
  subClassOf: Uri;
  scopeClass: Uri;
  state: State;
  definedBy: DefinedBy;
  properties: Property[];
  subject: Concept;
  equivalentClasses: Curie[];
  constraint: Constraint;
  version: Uri;

  unsaved: boolean = false;
  generalizedFrom: Class;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.curie = graph['@id'];
    this.subClassOf = graph.subClassOf;
    this.scopeClass = graph.scopeClass;
    this.state = graph.versionInfo;
    this.definedBy = new DefinedBy(graph.isDefinedBy, context, frame);
    this.properties = deserializeEntityList(graph.property, context, frame, Property);
    this.subject = deserializeOptional(graph.subject, context, frame, Concept);
    this.equivalentClasses = deserializeList<Curie>(graph.equivalentClass);
    this.constraint = new Constraint(graph.constraint || {}, context, frame);
    this.version = graph.identifier;
  }

  get id() {
    return this.fullId();
  }

  fullId(): Uri {
    if (this.curie) {
      return this.expandCurie(this.curie).uri;
    }
  }

  isSpecializedClass() {
    return this.definedBy.isOfType('profile');
  }

  generalize(model: Model, properties: Property[]) {
    const {value} = splitCurie(this.curie);
    const newClass = this.clone();
    newClass.unsaved = true;
    newClass.addNamespaceToContext(model);
    newClass.curie = model.prefix + ':' + value;
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
      '@id': this.curie,
      '@type': reverseMapTypeObject(this.type),
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      subClassOf: this.subClassOf,
      scopeClass: this.scopeClass,
      versionInfo: this.state,
      isDefinedBy: this.definedBy.serialize(true),
      property: serializeEntityList(this.properties),
      subject: serializeOptional(this.subject),
      equivalentClass: serializeList(this.equivalentClasses),
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

  addItem(shape: Class) {
    const graph = {
      '@id': shape.curie,
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
      and: this.constraint === 'and' ? serializeList(items) : null,
      or: this.constraint === 'or' ? serializeList(items) : null,
      not: this.constraint === 'not' ? serializeList(items) : null
    };
  }
}

export class ConstraintListItem extends GraphNode {

  shapeId: Uri;
  label: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.shapeId = graph['@id'];
    this.label = graph.label;
  }

  serializationValues() {
    return {
      '@id': this.shapeId,
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
  minCount: number;
  maxCount: number;
  pattern: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.state = graph.versionInfo;
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.example = graph.example;
    this.dataType = graph.datatype;
    this.valueClass = graph.valueShape;
    this.predicateCurie = graph.predicate;
    this.index = graph.index;
    this.minCount = graph.minCount;
    this.maxCount = graph.maxCount;
    this.pattern = graph.pattern;
  }

  hasAssociationTarget() {
    return !!this.valueClass;
  }

  get predicateId(): Uri {
    return this.expandCurie(this.predicateCurie).uri;
  }

  get glyphIconClass() {
    return glyphIconClassForType(this.dataType ? ['attribute'] : this.valueClass ? ['association'] : null);
  }

  clone(): Property {
    const serialization = this.serialize();
    return new Property(serialization['@graph'], serialization['@context'], this.frame);
  }

  serializationValues() {
    return {
      '@id': this.id,
      versionInfo: this.state,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      example: this.example,
      datatype: this.dataType,
      valueShape: this.valueClass,
      predicate: this.predicateCurie,
      index: this.index,
      minCount: this.minCount,
      maxCount: this.maxCount,
      pattern: this.pattern
    }
  }
}

abstract class AbstractPredicate extends GraphNode implements Location {

  label: Localizable;
  comment: Localizable;
  definedBy: DefinedBy;
  normalizedType: Type;
  selectionType: Type;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.definedBy = new DefinedBy(graph.isDefinedBy, context, frame);
    this.normalizedType = normalizePredicateType(this.type);
    this.selectionType = normalizeSelectionType(this.type);
  }

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
    return this.isOfType('attribute');
  }

  isAssociation() {
    return this.isOfType('association');
  }

  iowUrl(): RelativeUrl {
    return url(this.fullId(), this.type);
  }
}

export class PredicateListItem extends AbstractPredicate {

  id: Uri;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
  }

  fullId(): Uri {
    return this.id;
  }
}

export abstract class Predicate extends AbstractPredicate {

  curie: string;
  state: State;
  subPropertyOf: Uri;
  subject: Concept;
  equivalentProperties: Curie[];
  unsaved: boolean = false;
  version: Uri;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.curie = graph['@id'];
    this.state = graph.versionInfo;
    this.subPropertyOf = graph.subPropertyOf;
    this.subject = deserializeOptional(graph.subject, context, frame, Concept);
    this.equivalentProperties = deserializeList<Curie>(graph.equivalentProperty);
    this.version = graph.identifier;
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

  serializationValues() {
    return {
      '@id': this.curie,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      range: this.getRange(),
      versionInfo: this.state,
      subPropertyOf: this.subPropertyOf,
      subject: serializeOptional(this.subject),
      equivalentProperty: serializeList(this.equivalentProperties),
      identifier: this.version
    }
  }
}

export class Association extends Predicate {

  valueClass: Uri;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.valueClass = graph.range;
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
      range: this.valueClass
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

export class Concept extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  inScheme: Uri[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.label = deserializeLocalizable(graph.label || graph.prefLabel);
    this.comment = deserializeLocalizable(graph.comment || graph['rdfs:comment']);
    this.inScheme = _.map(deserializeList<any>(graph.inScheme), scheme => scheme['@id'] || scheme.uri);
  }
}

export class ConceptSuggestion extends Concept {

  createdAt: Moment;
  creator: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.createdAt = moment(graph.atTime, isoDateFormat);
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
    this.adminGroups = deserializeList<Uri>(graph.isAdminOf);
    this.memberGroups = deserializeList<Uri>(graph.isPartOf);
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

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
  }

  iowUrl() {
    return url(this.id, this.type);
  }
}

export class Usage extends GraphNode {

  id: Uri;
  label: Localizable;
  definedBy: DefinedBy;
  referrers: Referrer[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
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
    this.id = graph['@id'];
    this.label = deserializeLocalizable(graph.label);
    this.definedBy = deserializeOptional(graph.isDefinedBy, context, frame, DefinedBy);
    this.normalizedType = normalizeReferrerType(this.type);
  }

  iowUrl() {
    const expanded = this.expandCurie(this.id);
    return url(expanded ? expanded.uri : this.id, this.type);
  }
}

export class Activity extends GraphNode {

  id: Uri;
  createdAt: Moment;
  lastModifiedBy: UserLogin;
  versions: Entity[];
  latestVersion: Uri;
  private versionIndex: Map<Uri, number>;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.createdAt = deserializeDate(graph.startedAtTime);
    this.lastModifiedBy = deserializeUserLogin(graph.wasAttributedTo);
    this.versions = deserializeEntityList(graph.generated, context, frame, Entity).sort((lhs, rhs) => compareDates(rhs.createdAt, lhs.createdAt));
    this.versionIndex = indexById(this.versions);
    this.latestVersion = graph.used;
  }

  getVersion(version: Uri): Entity {
    const index = this.versionIndex.get(version);
    return index && this.versions[index];
  }

  get latest(): Entity {
    return this.getVersion(this.latestVersion);
  }
}

export class Entity extends GraphNode {

  id: Uri;
  createdAt: Moment;
  createdBy: UserLogin;
  previousVersion: Uri;

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

// TODO: when api returns coherent data get rid of this method
function fixIsDefinedBy(graph: any) {
  if (typeof graph === 'string') {
    console.log('Is defined by is a string and it should be an object');
    console.log(new Error().stack);
    console.log(graph);
    return {
      '@id': graph,
      '@type': 'owl:Ontology',
      'label': {'fi': graph, 'en': graph }
    };
  } else if (typeof graph === 'object' && !graph['@type']) {
    console.log('Is defined by object is missing the type');
    console.log(new Error().stack);
    console.log(graph);
    return Object.assign(graph, {
      '@type': 'owl:Ontology'
    });
  } else if (!graph) {
    console.log(new Error().stack);
    console.log('Is defined by is missing');
    return null;
  } else {
    return graph;
  }
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

function indexById<T extends {id: Uri}>(items: T[]): Map<Uri, number> {
  return new Map(items.map<[Uri, number]>((item: T, index: number) => [item.id, index]));
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

function serializeList(list: string[]) {
  if (list.length === 0) {
    return null;
  }

  return list.slice();
}

function deserializeList<T>(list: any) {
  return normalizeAsArray<T>(list);
}

function serializeLocalizable(localizable: Localizable) {
  return Object.assign({}, localizable);
}

function deserializeLocalizable(localizable: any) {
  return localizable;
}

function deserializeDate(date: any) {
  return moment(date, isoDateFormat);
}

function deserializeOptionalDate(date: any) {
  return date && deserializeDate(date);
}

function deserializeUserLogin(userName: string): UserLogin {
  return userName.substring('mailto:'.length);
}

function mapType(type: string): Type {
  switch (type) {
    case 'rdfs:Class':
      return 'class';
    case 'sh:Shape':
      return 'shape';
    case 'owl:DatatypeProperty':
      return 'attribute';
    case 'owl:ObjectProperty':
      return 'association';
    case 'owl:Ontology':
      return 'model';
    case 'dcap:DCAP':
      return 'profile';
    case 'foaf:Group':
      return 'group';
    case 'dcap:MetadataVocabulary':
      return 'library';
    case 'sh:AbstractOrNodeConstraint':
    case 'sh:AbstractAndNodeConstraint':
    case 'sh:AbstractNotNodeConstraint':
      return 'constraint';
    case 'foaf:Person':
      return 'user';
    case 'skos:ConceptScheme':
      return 'concept';
    case 'prov:Entity':
      return 'entity';
    case 'prov:Activity':
      return 'activity';
    default:
      console.log('unknown type not mapped: ' + type);
      // continue
  }
}

function reverseMapType(type: string): Type {
  switch (type) {
    case 'class':
      return 'rdfs:Class';
    case 'shape':
      return 'sh:Shape';
    case 'attribute':
      return 'owl:DatatypeProperty';
    case 'association':
      return 'owl:ObjectProperty';
    case 'model':
      return 'owl:Ontology';
    case 'profile':
      return 'dcap:DCAP';
    case 'group':
      return 'foaf:Group';
    case 'library':
      return 'dcap:MetadataVocabulary';
    default:
      console.log('unknown type not mapped: ' + type);
    // continue
  }
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

export function modelUrl(id: Uri): RelativeUrl {
  return `/model?urn=${encodeURIComponent(id)}`;
}

export function url(id: Uri, type: Type[]) {
  if (containsAny(type, ['model', 'profile'])) {
    return modelUrl(id);
  } else if (containsAny(type, ['group'])) {
    return `/group?urn=${encodeURIComponent(id)}`;
  } else if (containsAny(type, ['association', 'attribute'])) {
    const [modelId] = id.split('#');
    return `${modelUrl(modelId)}&predicate=${encodeURIComponent(id)}`;
  } else if (containsAny(type, ['class', 'shape'])) {
    const [modelId] = id.split('#');
    return `${modelUrl(modelId)}&class=${encodeURIComponent(id)}`;
  } else {
    throw new Error('Unsupported type for url: ' + type);
  }
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
  const frameObject = frame(data);
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

function frameAndMapArray<T extends GraphNode>($log: angular.ILogService, data: any, frame: any, entityFactory: EntityFactory<T>): IPromise<T[]> {
  const frameObject = frame(data);
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
    return frameAndMap(this.$log, data, frames.conceptSuggestionFrame, (framedData) => ConceptSuggestion);
  }

  deserializeConceptSuggestions(data: any): IPromise<ConceptSuggestion[]> {
    return frameAndMapArray(this.$log, data, frames.conceptSuggestionFrame, (framedData) => ConceptSuggestion);
  }

  deserializeConcept(data: any, id: Uri): IPromise<Concept> {
    const frameObject = frames.fintoConceptFrame(data, id);
    return frameData(this.$log, data, frameObject)
      .then(framed => new Concept(renameProperty(framed.graph[0], 'uri', '@id'), framed['@context'], frameObject));
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
