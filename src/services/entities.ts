import IPromise = angular.IPromise;
import * as _ from 'lodash';
import * as frames from './frames';
import * as moment from 'moment';

import Moment = moment.Moment;
import { Frame } from './frames';
import { FrameFn } from './frames';
import { mapType, reverseMapType } from './typeMapping';
import { config } from '../config';
import { Uri, Url, Urn, RelativeUrl } from './uri';
import { comparingDate, comparingNumber } from './comparators';
import { DataType } from './dataTypes';
import { Language, hasLocalization } from '../utils/language';
import { containsAny, normalizeAsArray, swapElements, contains } from '../utils/array';
import { glyphIconClassForType } from '../utils/entity';
import {
  normalizeModelType, normalizeSelectionType, normalizeClassType, normalizePredicateType,
  normalizeReferrerType
} from '../utils/type';
import { identity } from '../utils/function';

const jsonld: any = require('jsonld');

const isoDateFormat = 'YYYY-MM-DDTHH:mm:ssz';

export interface EditableEntity {
  id: Uri;
  normalizedType: Type;
  isOfType(type: Type): boolean;
  unsaved: boolean;
  clone<T>(): T;
  serialize<T>(): T;
}

export type Localizable = { [language: string]: string; }
export type UserLogin = string;

export type Concept = FintoConcept|ConceptSuggestion;

export type Type = 'class'
                 | 'shape'
                 | 'attribute'
                 | 'association'
                 | 'property'
                 | 'model'
                 | 'profile'
                 | 'group'
                 | 'library'
                 | 'constraint'
                 | 'user'
                 | 'concept'
                 | 'conceptSuggestion'
                 | 'entity'
                 | 'activity'
                 | 'resource'
                 | 'collection'
                 | 'scheme'
                 | 'standard'
                 | 'codeScheme'
                 | 'externalCodeScheme'
                 | 'codeGroup'
                 | 'code';

export type State = 'Unstable'
                  | 'Draft'
                  | 'Recommendation'
                  | 'Deprecated';

export type ConstraintType = 'or'
                           | 'and'
                           | 'not';

export type GraphData = {
  '@context': any;
  '@graph': any;
}

interface EntityConstructor<T extends GraphNode> {
  new(graph: any, context: any, frame: any): T;
}

type EntityFactory<T extends GraphNode> = (framedData: any) => EntityConstructor<T>;

export function isLocalizable(obj: any): obj is Localizable {
  return typeof obj === 'object';
}

export class ExternalEntity {
  constructor(public type: Type, public id?: Uri) {
  }

  get normalizedType() {
    return this.type;
  }
}

export interface LanguageContext {
  id: Uri;
  language: Language[];
}

export abstract class GraphNode {

  type: Type[];

  constructor(public graph: any, public context: any, public frame: any) {
    this.type = mapGraphTypeObject(graph);
  }

  isOfType(type: Type) {
    return containsAny(this.type, [type]);
  }

  get glyphIconClass(): any {
    return glyphIconClassForType(this.type);
  }

  serializationValues(clone: boolean): {} {
    return {};
  }

  serialize(inline: boolean = false, clone: boolean = false): any {
    const values = Object.assign(this.graph, this.serializationValues(clone));

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

    if (typeof graph === 'string' || graph instanceof String) {
      const str = (graph instanceof String) ? graph.valueOf() : graph;
      this.id = new Uri(str, context);
      this.label = deserializeLocalizable({'fi': this.id.uri, 'en': this.id.uri });

    } else if (typeof graph === 'object') {
      this.id = new Uri(graph['@id'], context);
      this.label = deserializeLocalizable(graph.label);
    } else {
      throw new Error('Unsupported is defined sub-graph');
    }
  }
}

export abstract class AbstractGroup extends GraphNode {

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

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
  }
}

export class GroupListItem extends AbstractGroup {
  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export class Group extends AbstractGroup {

  unsaved: boolean;
  language: Language[] = ['fi', 'en'];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }

  clone(): Group {
    const serialization = this.serialize(false, true);
    const result =  new Group(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    return result;
  }
}

abstract class AbstractModel extends GraphNode {

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

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
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
  relations: Relation[];
  codeSchemes: CodeScheme[];
  unsaved: boolean = false;
  namespace: Url;
  prefix: string;
  group: GroupListItem;
  version: Urn;
  rootClass: Uri;
  language: Language[];

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
    this.relations = deserializeEntityList(graph.relations, context, frame, Relation);
    this.codeSchemes = deserializeEntityList(graph.codeLists, context, frame, CodeScheme);
    this.version = graph.identifier;
    if (graph.rootResource) {
      this.rootClass = new Uri(graph.rootResource, context);
    }
    this.language = deserializeList<Language>(graph.language || ['fi', 'en']);
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
    if (require.namespaceType !== NamespaceType.TECHNICAL) {
      delete this.context[require.prefix];
    }
    _.remove(this.requires, require);
  }

  addRelation(relation: Relation) {
    this.relations.push(relation);
  }

  removeRelation(relation: Relation) {
    _.remove(this.relations, relation);
  }

  addCodeScheme(codeScheme: CodeScheme) {
    this.codeSchemes.push(codeScheme);
  }

  removeCodeScheme(codeScheme: CodeScheme) {
    _.remove(this.codeSchemes, codeScheme);
  }

  getNamespaceNames(exclude?: Require): Set<string> {
    const namespaceNames = new Set<string>();

    for (const namespace of this.getNamespaces()) {
      if (!exclude || exclude.namespace !== namespace.url) {
        namespaceNames.add(namespace.url);
      }
    }

    return namespaceNames;
  }

  getPrefixNames(exclude?: Require): Set<string> {
    const prefixNames = new Set<string>();

    for (const namespace of this.getNamespaces()) {
      if (!exclude || exclude.prefix !== namespace.prefix) {
        prefixNames.add(namespace.prefix);
      }
    }

    return prefixNames;
  }

  getNamespaces() {
    const namespaces: Namespace[] = [];
    const requiredNamespacePrefixes = new Set<string>();

    namespaces.push(new Namespace(this.prefix, this.namespace, NamespaceType.MODEL));
    requiredNamespacePrefixes.add(this.prefix);

    for (const require of this.requires) {
      namespaces.push(new Namespace(require.prefix, require.namespace, require.namespaceType));
      requiredNamespacePrefixes.add(require.prefix);
    }

    for (const prefix of Object.keys(this.context)) {
      if (!requiredNamespacePrefixes.has(prefix)) {
        const value = this.context[prefix];
        if (typeof value === 'string') {
          namespaces.push(new Namespace(prefix, value, NamespaceType.IMPLICIT_TECHNICAL));
        }
      }
    }

    return namespaces;
  }

  getNamespacesOfType(...namespaceTypes: NamespaceType[]) {
    const result: {[prefix: string]: string} = {};

    for (const namespace of this.getNamespaces()) {
      if (_.contains(namespaceTypes, namespace.type)) {
        result[namespace.prefix] = namespace.url;
      }
    }

    return result;
  }

  private copyNamespacesFromRequires() {
    for (const require of this.requires) {
      // if overriding existing namespace remove previous prefix
      for (const prefix of Object.keys(this.context)) {
        const value = this.context[prefix];
        if (value === require.namespace) {
          delete this.context[prefix];
        }
      }
      this.context[require.prefix] = require.namespace;
    }
  }

  expandContextWithKnownModels(context: any) {
    Object.assign(context, this.getNamespacesOfType(NamespaceType.MODEL, NamespaceType.EXTERNAL));
  }

  asDefinedBy() {
    return new DefinedBy({'@id': this.id.uri, '@type': reverseMapTypeObject(this.type), label: this.label}, this.context, this.frame);
  }

  namespaceAsDefinedBy(ns: Url) {
    for (const require of this.requires) {
      if (ns === require.namespace) {
        return new DefinedBy({'@id': ns, '@type': reverseMapTypeObject(require.type)}, this.context, this.frame);
      }
    }
    throw new Error('Namespace not found: ' + ns);
  }

  isNamespaceKnownToBeNotModel(namespace: Url) {
    return this.isNamespaceKnownAndOfType(namespace, [NamespaceType.EXTERNAL, NamespaceType.TECHNICAL, NamespaceType.IMPLICIT_TECHNICAL]);
  }

  isNamespaceKnownToBeModel(namespace: Url) {
    return this.isNamespaceKnownAndOfType(namespace, [NamespaceType.MODEL]);
  }

  isNamespaceKnownAndOfType(namespace: Url, types: NamespaceType[])  {
    for (const knownNamespace of this.getNamespaces()) {
      if (namespace === knownNamespace.url && containsAny(types, [knownNamespace.type])) {
        return true;
      }
    }
    return false;
  }

  linkTo(destination: Destination, href: boolean) {
    if (destination) {
      const id = destination.id;
      const typeArray: Type[] = normalizeAsArray<Type>(destination.type);

      if (id && !id.isUrn()) {
        return this.isNamespaceKnownToBeModel(id.namespace) ? internalUrl(id, typeArray, href) : id.url;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  clone(): Model {
    const serialization = this.serialize(false, true);
    const result = new Model(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    return result;
  }

  serializationValues(clone: boolean): {} {
    this.copyNamespacesFromRequires();

    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      versionInfo: this.state,
      references: serializeEntityList(this.references, clone),
      requires: serializeEntityList(this.requires, clone),
      relations: serializeEntityList(this.relations, clone),
      codeLists: serializeEntityList(this.codeSchemes, clone),
      identifier: this.version,
      rootResource: this.rootClass && this.rootClass.uri,
      language: serializeList(this.language)
    };
  }
}

export interface Destination {
  id: Uri;
  type?: Type|Type[];
}

export enum NamespaceType {
  IMPLICIT_TECHNICAL, TECHNICAL, MODEL, EXTERNAL
}

export class Namespace {
  constructor(public prefix: string, public url: string, public type: NamespaceType) {
  }
}

export class Relation extends GraphNode {

  homepage: Uri;
  title: Localizable;
  description: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.homepage = graph.homepage && new Uri(graph.homepage);
    this.title = deserializeLocalizable(graph.title);
    this.description = deserializeLocalizable(graph.description);
  }

  serializationValues(): any {
    return {
      homepage: this.homepage.uri,
      title: serializeLocalizable(this.title),
      description: serializeLocalizable(this.description)
    };
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

  get local() {
    return this.isOfType('collection');
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
  namespaceType: NamespaceType;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this._namespace = graph.preferredXMLNamespaceName;
    this.prefix = graph.preferredXMLNamespacePrefix;

    if (this.isOfType('resource')) {
      this.namespaceType = NamespaceType.EXTERNAL;
    } else if (this.isOfType('standard')) {
      this.namespaceType = NamespaceType.TECHNICAL;
    } else {
      this.namespaceType = NamespaceType.MODEL;
    }
  }

  get external() {
    return this.namespaceType === NamespaceType.EXTERNAL;
  }

  get technical() {
    return this.namespaceType === NamespaceType.TECHNICAL;
  }

  get prefixModifiable() {
    return this.external;
  }

  get namespaceModifiable() {
    return this.external;
  }

  get labelModifiable() {
    return this.external || this.technical;
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

  serializationValues(clone: boolean): {} {
    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      preferredXMLNamespaceName: this.namespace,
      preferredXMLNamespacePrefix: this.prefix
    };
  }
}

export class CodeServer extends GraphNode {
  id: Uri;
  identifier: string;
  description: Localizable;
  title: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id']);
    this.identifier = graph.identifier;
    this.description = deserializeLocalizable(graph.description);
    this.title = deserializeLocalizable(graph.title);
  }
}

export class CodeGroup extends GraphNode {
  id: Uri;
  title: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id']);
    this.title = deserializeLocalizable(graph.title);
  }
}

export class CodeScheme extends GraphNode {

  id: Uri;
  title: Localizable;
  description: Localizable;
  creator: string;
  identifier: string;
  groups: CodeGroup[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id']);
    this.title = deserializeLocalizable(graph.title);
    this.description = deserializeLocalizable(graph.description);
    this.creator = graph.creator;
    this.identifier = graph.identifier;
    this.groups = deserializeEntityList(graph.isPartOf, context, frame, CodeGroup);
  }

  isExternal() {
    return this.isOfType('externalCodeScheme');
  }

  serializationValues(clone: boolean): {} {
    return {
      '@id': this.id.uri,
      title: serializeLocalizable(this.title),
      description: serializeLocalizable(this.description),
      identifier: this.identifier
    };
  }
}

export class CodeValue extends GraphNode {

  id: Uri;
  title: Localizable;
  identifier: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id']);
    this.title = deserializeLocalizable(graph.title);
    this.identifier = graph.identifier;
  }
}

export abstract class AbstractClass extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  selectionType: Type;
  normalizedType: Type;
  definedBy: DefinedBy;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.selectionType = normalizeSelectionType(this.type);
    this.normalizedType = normalizeClassType(this.type);
    // TODO: remove this if when externalClass API is fixed to return it
    if (graph.isDefinedBy) {
      this.definedBy = new DefinedBy(graph.isDefinedBy, context, frame);
    }
  }

  isClass() {
    return true;
  }

  isPredicate() {
    return false;
  }

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
  }

  isSpecializedClass() {
    return this.definedBy.isOfType('profile');
  }
}

export class ClassListItem extends AbstractClass {

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
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
  properties: Property[];
  subject: Concept;
  equivalentClasses: Uri[];
  constraint: Constraint;
  version: Urn;
  editorialNote: Localizable;

  unsaved: boolean = false;
  external: boolean = false;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    if (graph.subClassOf) {
      this.subClassOf = new Uri(graph.subClassOf, context);
    }
    if (graph.scopeClass) {
      this.scopeClass = new Uri(graph.scopeClass, context);
    }
    this.state = graph.versionInfo;

    this.properties = deserializeEntityList(graph.property, context, frame, Property)
      .sort(comparingNumber<Property>(property => property.index));

    // normalize indices
    for (let i = 0; i < this.properties.length; i++) {
      this.properties[i].index = i;
    }

    if (graph.subject) {
      this.subject = ConceptSuggestion.isConceptSuggestionGraph(graph.subject)
        ? new ConceptSuggestion(graph.subject, context, frame)
        : new FintoConcept(graph.subject, context, frame);
    }
    this.equivalentClasses = deserializeList(graph.equivalentClass, equivalentClass => new Uri(equivalentClass, context));
    this.constraint = new Constraint(graph.constraint || {}, context, frame);
    this.version = graph.identifier;
    this.editorialNote = deserializeLocalizable(graph.editorialNote);
  }

  get inUnstableState(): boolean {
    return this.state === 'Unstable';
  }

  movePropertyUp(property: Property) {
    this.swapProperties(property.index, property.index - 1);
  }

  movePropertyDown(property: Property) {
    this.swapProperties(property.index, property.index + 1);
  }

  private swapProperties(index1: number, index2: number) {
    swapElements(this.properties, index1, index2, (property, index) => property.index = index);
  }

  addProperty(property: Property): void {
    property.index = this.properties.length;
    this.properties.push(property);
  }

  removeProperty(property: Property): void {
    _.remove(this.properties, property);
  }

  clone(): Class {
    const serialization = this.serialize(false, true);
    const result = new Class(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    result.external = this.external;
    return result;
  }

  serializationValues(clone: boolean): {} {
    return {
      '@id': this.id.uri,
      '@type': reverseMapTypeObject(this.type),
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      subClassOf: this.subClassOf && this.subClassOf.uri,
      scopeClass: this.scopeClass && this.scopeClass.uri,
      versionInfo: this.state,
      isDefinedBy: this.definedBy.serialize(true),
      property: serializeEntityList(this.properties, clone),
      subject: serializeOptional(this.subject, clone),
      equivalentClass: serializeList(this.equivalentClasses, equivalentClass => equivalentClass.uri),
      constraint: serializeOptional(this.constraint, clone, constraint => constraint.items.length > 0 || hasLocalization(constraint.comment)),
      identifier: this.version,
      editorialNote: serializeLocalizable(this.editorialNote)
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
    return this.items.length > 0 || hasLocalization(this.comment);
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

  serializationValues(clone: boolean): {} {
    function mapConstraintType(constraint: ConstraintType) {
      switch (constraint) {
        case 'or':
          return 'sh:AbstractOrNodeConstraint';
        case 'and':
          return 'sh:AbstractAndNodeConstraint';
        case 'not':
          return 'sh:AbstractNotNodeConstraint';
        default:
          throw new Error('Unsupported constraint: ' + constraint);
      }
    }

    const items = serializeEntityList(this.items, clone);

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

  serializationValues(clone: boolean): {} {
    return {
      '@id': this.shapeId.uri
    };
  }
}

export class Property extends GraphNode {

  internalId: Uri;
  externalId: string;
  state: State;
  label: Localizable;
  comment: Localizable;
  example: string;
  defaultValue: string;
  dataType: DataType;
  valueClass: Uri;
  predicate: Uri|Predicate;
  index: number;
  minCount: number;
  maxCount: number;
  minLength: number;
  maxLength: number;
  in: string[];
  hasValue: string;
  pattern: string;
  codeScheme: CodeScheme;
  predicateType: Type;
  classIn: Uri[];
  editorialNote: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.internalId = new Uri(graph['@id'], context);
    this.externalId = graph['identifier'];
    this.state = graph.versionInfo;
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.example = graph.example;
    this.defaultValue = graph.defaultValue;
    this.dataType = graph.datatype;
    this.classIn = deserializeList(graph.classIn, klass => new Uri(klass, context));
    this.codeScheme = deserializeOptional(graph.memberOf, context, frame, CodeScheme);

    if (graph.type) {
      this.predicateType = mapType(graph.type);
    }

    if (graph.valueShape) {
      this.valueClass = new Uri(graph.valueShape, context);
    }

    if (typeof graph.predicate === 'object') {
      const types = mapGraphTypeObject(graph.predicate);

      if (containsAny(types, ['association'])) {
        this.predicate = new Association(graph.predicate, context, frame);
      } else if (containsAny(types, ['attribute'])) {
        this.predicate = new Attribute(graph.predicate, context, frame);
      } else {
        throw new Error('Incompatible predicate type: ' + types.join());
      }
    } else if (typeof graph.predicate === 'string') {
      this.predicate = new Uri(graph.predicate, context);
    } else {
      throw new Error('Unsupported predicate: ' + graph.predicate);
    }

    this.index = graph.index;
    this.minCount = graph.minCount;
    this.maxCount = graph.maxCount;
    this.minLength = graph.minLength;
    this.maxLength = graph.maxLength;
    this.in = deserializeList<string>(graph.in);
    this.hasValue = graph.hasValue;
    this.pattern = graph.pattern;
    this.editorialNote = deserializeLocalizable(graph.editorialNote);
  }

  get predicateId() {
    const predicate = this.predicate;
    if (predicate instanceof Predicate) {
      return predicate.id;
    } else if (predicate instanceof Uri) {
      return predicate;
    } else {
      throw new Error('Unsupported predicate: ' + predicate);
    }
  }

  get inputType(): DataType {
    if (this.dataType) {
      return this.dataType;
    } else {
      return 'xsd:anyURI';
    }
  }

  hasAssociationTarget() {
    return !!this.valueClass;
  }

  isAssociation() {
    return this.normalizedPredicateType === 'association';
  }

  isAttribute() {
    return this.normalizedPredicateType === 'attribute';
  }

  get inUnstableState(): boolean {
    return this.state === 'Unstable';
  }

  get normalizedPredicateType(): Type {
    if (this.predicateType) {
      return this.predicateType;
    } else {
      const predicate = this.predicate;
      if (predicate instanceof Predicate) {
        return predicate.normalizedType;
      } else {
        return this.dataType ? 'attribute' : this.valueClass ? 'association' : null;
      }
    }
  }

  get glyphIconClass() {
    const type = this.normalizedPredicateType;
    return glyphIconClassForType(type ? [type] : []);
  }

  clone(): Property {
    const serialization = this.serialize(false, true);
    return new Property(serialization['@graph'], serialization['@context'], this.frame);
  }

  serializationValues(clone: boolean): {} {

    const predicate = this.predicate;

    function serializePredicate() {
      if (predicate instanceof Predicate) {
        if (clone) {
          return predicate.serialize(clone);
        } else {
          return predicate.id.uri;
        }
      } else if (predicate instanceof Uri) {
        return predicate.uri;
      } else {
        throw new Error('Unsupported predicate: ' + predicate);
      }
    }

    return {
      '@id': this.internalId.uri,
      identifier: this.externalId,
      versionInfo: this.state,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      example: this.example,
      defaultValue: this.defaultValue,
      datatype: this.dataType,
      valueShape: this.valueClass && this.valueClass.uri,
      predicate: serializePredicate(),
      index: this.index,
      minCount: this.minCount,
      maxCount: this.maxCount,
      minLength: this.minLength,
      maxLength: this.maxLength,
      in: serializeList(this.in),
      hasValue: this.hasValue,
      pattern: this.pattern,
      classIn: serializeList(this.classIn, classId => classId.uri),
      memberOf: serializeOptional(this.codeScheme, clone),
      editorialNote: serializeLocalizable(this.editorialNote)
    };
  }
}

export abstract class AbstractPredicate extends GraphNode {

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

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
  }
}

export class PredicateListItem extends AbstractPredicate {

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export class Predicate extends AbstractPredicate {

  state: State;
  subPropertyOf: Uri;
  subject: Concept;
  equivalentProperties: Uri[];
  version: Urn;
  editorialNote: Localizable;

  unsaved: boolean = false;
  external: boolean = false;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.state = graph.versionInfo;
    if (graph.subPropertyOf) {
      this.subPropertyOf = new Uri(graph.subPropertyOf, context);
    }
    if (graph.subject) {
      this.subject = ConceptSuggestion.isConceptSuggestionGraph(graph.subject)
        ? new ConceptSuggestion(graph.subject, context, frame)
        : new FintoConcept(graph.subject, context, frame);
    }
    this.equivalentProperties = deserializeList(graph.equivalentProperty, equivalentProperty => new Uri(equivalentProperty, context));
    this.version = graph.identifier;
    this.editorialNote = deserializeLocalizable(graph.editorialNote);
  }

  get inUnstableState(): boolean {
    return this.state === 'Unstable';
  }

  serializationValues(clone: boolean): {} {
    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      versionInfo: this.state,
      subPropertyOf: this.subPropertyOf && this.subPropertyOf.uri,
      subject: serializeOptional(this.subject, clone),
      equivalentProperty: serializeList(this.equivalentProperties, equivalentProperty => equivalentProperty.uri),
      identifier: this.version,
      editorialNote: serializeLocalizable(this.editorialNote)
    };
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

  clone(): Association {
    const serialization = this.serialize(false, true);
    const result = new Association(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    result.external = this.external;
    return result;
  }

  serializationValues(clone: boolean): {} {
    return Object.assign(super.serializationValues(clone), {
      range: this.valueClass && this.valueClass.uri
    });
  }
}

export class Attribute extends Predicate {

  dataType: DataType;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.dataType = graph.range;
  }

  clone(): Attribute {
    const serialization = this.serialize(false, true);
    const result = new Attribute(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    result.external = this.external;
    return result;
  }

  serializationValues(clone: boolean): {} {
    return Object.assign(super.serializationValues(clone), {
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
    this.comment = deserializeLocalizable(graph.definition || graph.comment);
    this.inScheme = deserializeList<Url>(graph.inScheme);
  }

  get suggestion() {
    return false;
  }
}

export class FintoConceptSearchResult extends GraphNode {
  id: Uri;
  label: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.prefLabel);
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

  get suggestion() {
    return true;
  }

  static isConceptSuggestionGraph(withType: { '@type': string|string[] }) {
    return contains(mapGraphTypeObject(withType), 'conceptSuggestion');
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
    return contains(this.memberGroups, id, (lhs, rhs) => lhs.equals(rhs));
  }

  isAdminOf(entity: Model|AbstractGroup) {
    return this.isAdminOfGroup(entity.groupId);
  }

  isAdminOfGroup(id: Uri) {
    return contains(this.adminGroups, id, (lhs, rhs) => lhs.equals(rhs));
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

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
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

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
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
    this.versions = deserializeEntityList(graph.generated, context, frame, Entity).sort(comparingDate<Entity>(entity => entity.createdAt));
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

function indexById<T extends {id: Urn}>(items: T[]): Map<Urn, number> {
  return new Map(items.map<[Urn, number]>((item: T, index: number) => [item.id, index]));
}

function serializeOptional<T extends GraphNode>(entity: T, clone: boolean, isDefined: (entity: T) => boolean = (e: T) => !!e) {
  return isDefined(entity) ? entity.serialize(true, clone) : null;
}

function deserializeOptional<T extends GraphNode>(graph: any, context: any, frame: any, entity: EntityConstructor<T>): T {
  if (graph) {
    return new entity(graph, context, frame);
  } else {
    return null;
  }
}

function serializeEntityList(list: GraphNode[], clone: boolean) {
  if (list.length === 0) {
    return null;
  }
  return _.map(list, listItem => listItem.serialize(true, clone));
}

function deserializeEntityList<T extends GraphNode>(list: any, context: any, frame: any, entity: EntityConstructor<T>): T[] {
  return _.map<any, T>(normalizeAsArray(list), obj => new entity(obj, context, frame));
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
  const result: Localizable = {};

  if (localizable) {
    for (const lang of Object.keys(localizable)) {
      const value = localizable[lang];
      result[lang] = Array.isArray(value) ? value.join(' ') : value;
    }
  }

  return result;
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

function mapGraphTypeObject(withType: { '@type': string|string[] }): Type[] {
  return _.chain(normalizeAsArray(withType['@type']))
    .map(mapType)
    .reject(type => !type)
    .value();
}

function reverseMapTypeObject(types: Type[]): string[] {
  return _.chain(normalizeAsArray(types))
    .map(reverseMapType)
    .reject(type => !type)
    .value();
}

export function modelUrl(id: string, href: boolean): RelativeUrl {
  return (href ? '#' : '') + `/model?urn=${encodeURIComponent(id)}`;
}

export function groupUrl(id: string, href: boolean): RelativeUrl {
  return (href ? '#' : '') + `/group?urn=${encodeURIComponent(id)}`;
}

export function internalUrl(id: Uri, type: Type[], href: boolean): RelativeUrl {
  if (id) {
    if (containsAny(type, ['model', 'profile'])) {
      return modelUrl(id.uri, href);
    } else if (containsAny(type, ['group'])) {
      return `${groupUrl(id.uri, href)}`;
    } else if (containsAny(type, ['association', 'attribute'])) {
      return `${modelUrl(id.namespaceId, href)}&${normalizeSelectionType(type)}=${encodeURIComponent(id.uri)}`;
    } else if (containsAny(type, ['class', 'shape'])) {
      return `${modelUrl(id.namespaceId, href)}&class=${encodeURIComponent(id.uri)}`;
    } else {
      throw new Error('Unsupported type for url: ' + type);
    }
  } else {
    return null;
  }
}

function frameData($log: angular.ILogService, data: GraphData, frame: any): IPromise<GraphData> {
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

function frameAndMap<T extends GraphNode>($log: angular.ILogService, data: GraphData, frame: Frame|FrameFn, entityFactory: EntityFactory<T>): IPromise<T> {
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

function frameAndMapArray<T extends GraphNode>($log: angular.ILogService, data: GraphData, frame: Frame|FrameFn, entityFactory: EntityFactory<T>): IPromise<T[]> {
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

  deserializeGroupList(data: GraphData): IPromise<GroupListItem[]> {
    return frameAndMapArray(this.$log, data, frames.groupListFrame, (framedData) => GroupListItem);
  }

  deserializeGroup(data: GraphData): IPromise<Group> {
    return frameAndMap(this.$log, data, frames.groupFrame, (framedData) => Group);
  }

  deserializeModelList(data: GraphData): IPromise<ModelListItem[]> {
    return frameAndMapArray(this.$log, data, frames.modelListFrame, (framedData) => ModelListItem);
  }

  deserializeModel(data: GraphData): IPromise<Model> {
    return frameAndMap(this.$log, data, frames.modelFrame, (framedData) => Model);
  }

  deserializeClassList(data: GraphData): IPromise<ClassListItem[]> {
    return frameAndMapArray(this.$log, data, frames.classListFrame, (framedData) => ClassListItem);
  }

  deserializeClass(data: GraphData): IPromise<Class> {
    return frameAndMap(this.$log, data, frames.classFrame, (framedData) => Class);
  }

  deserializeProperty(data: GraphData): IPromise<Property> {
    return frameAndMap(this.$log, data, frames.propertyFrame, (framedData) => Property);
  }

  deserializePredicateList(data: GraphData): IPromise<PredicateListItem[]> {
    return frameAndMapArray(this.$log, data, frames.predicateListFrame, (framedData) => PredicateListItem);
  }

  deserializePredicate(data: GraphData): IPromise<Attribute|Association|Predicate> {
    const entityFactory: EntityFactory<Predicate> = (framedData) => {
      const types = mapGraphTypeObject(framedData['@graph'][0]);

      if (containsAny(types, ['association'])) {
        return Association;
      } else if (containsAny(types, ['attribute'])) {
        return Attribute;
      } else if (containsAny(types, ['property'])) {
        return Predicate;
      } else {
        throw new Error('Incompatible type: ' + types.join());
      }
    };

    return frameAndMap(this.$log, data, frames.predicateFrame, entityFactory);
  }

  deserializeConceptSuggestion(data: GraphData): IPromise<ConceptSuggestion> {
    return frameAndMap(this.$log, data, frames.iowConceptFrame, (framedData) => ConceptSuggestion);
  }

  deserializeConceptSuggestions(data: GraphData): IPromise<ConceptSuggestion[]> {
    return frameAndMapArray(this.$log, data, frames.iowConceptFrame, (framedData) => ConceptSuggestion);
  }

  deserializeFintoConcept(data: GraphData, id: Url): IPromise<FintoConcept> {
    return frameAndMap(this.$log, data, frames.fintoConceptFrame(data, id), (framedData) => FintoConcept);
  }

  deserializeFintoConceptSearchResults(data: GraphData): IPromise<FintoConceptSearchResult[]> {
    return frameAndMapArray(this.$log, data, frames.fintoConceptSearchResultsFrame(data), (framedData) => FintoConceptSearchResult);
  }

  deserializeRequire(data: GraphData): IPromise<Require> {
    return frameAndMap(this.$log, data, frames.requireFrame, (framedData) => Require);
  }

  deserializeRequires(data: GraphData): IPromise<Require[]> {
    return frameAndMapArray(this.$log, data, frames.requireFrame, (framedData) => Require);
  }

  deserializeCodeServers(data: GraphData): IPromise<CodeServer[]> {
    return frameAndMapArray(this.$log, data, frames.codeServerFrame, (framedData) => CodeServer);
  }

  deserializeCodeScheme(data: GraphData): IPromise<CodeScheme> {
    return frameAndMap(this.$log, data, frames.codeSchemeFrame, (framedData) => CodeScheme);
  }

  deserializeCodeSchemes(data: GraphData): IPromise<CodeScheme[]> {
    return frameAndMapArray(this.$log, data, frames.codeSchemeFrame, (framedData) => CodeScheme);
  }

  deserializeCodeValues(data: GraphData): IPromise<CodeValue[]> {
    return frameAndMapArray(this.$log, data, frames.codeValueFrame, (framedData) => CodeValue);
  }

  deserializeUser(data: GraphData): IPromise<User> {
    return frameAndMap(this.$log, data, frames.userFrame, (framedData) => DefaultUser);
  }

  deserializeSearch(data: GraphData): IPromise<SearchResult[]> {
    return frameAndMapArray(this.$log, data, frames.searchResultFrame, (framedData) => SearchResult);
  }

  deserializeClassVisualization(data: GraphData): IPromise<VisualizationClass[]> {
    return frameAndMapArray(this.$log, data, frames.classVisualizationFrame, (framedData) => VisualizationClass);
  }

  deserializeModelVisualization(data: GraphData): IPromise<VisualizationClass[]> {
    return frameAndMapArray(this.$log, data, frames.classVisualizationFrame, (framedData) => VisualizationClass);
  }

  deserializeUsage(data: GraphData): IPromise<Usage> {
    return frameAndMap(this.$log, data, frames.usageFrame, (framedData) => Usage);
  }

  deserializeVersion(data: GraphData): IPromise<Activity> {
    return frameAndMap(this.$log, data, frames.versionFrame, (framedData) => Activity);
  }
}
