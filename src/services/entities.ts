import { IPromise, ILogService } from 'angular';
import * as _ from 'lodash';
import * as frames from './frames';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Frame } from './frames';
import { mapType, reverseMapType } from './typeMapping';
import { config } from '../config';
import { Uri, Url, Urn, RelativeUrl } from './uri';
import { comparingDate, comparingNumber } from './comparators';
import { DataType } from './dataTypes';
import {
  Language, hasLocalization, createConstantLocalizable,
  availableUILanguages
} from '../utils/language';
import {
  containsAny, normalizeAsArray, swapElements, contains, arraysAreEqual, filterDefined
} from '../utils/array';
import { Iterable } from '../utils/iterable';
import {
  glyphIconClassForType, indexById, copyVertices, copyCoordinate, glyphIconClassUnknown,
  normalizeAsSingle
} from '../utils/entity';
import {
  normalizeModelType, normalizeClassType, normalizePredicateType,
  normalizeReferrerType
} from '../utils/type';
import { identity } from '../utils/function';
// TODO entities should not depend on services
import { Localizer } from './languageService';
import { isDefined, areEqual, requireDefined } from '../utils/object';

const jsonld: any = require('jsonld');

const isoDateFormat = 'YYYY-MM-DDTHH:mm:ssz';

export interface EditableEntity {
  id: Uri;
  label: Localizable;
  normalizedType: Type;
  isOfType(type: Type): boolean;
  unsaved: boolean;
  clone<T>(): T;
  serialize<T>(): T;
}

// TODO: type language indexer as Language when typescript supports it https://github.com/Microsoft/TypeScript/issues/5683
export type Localizable = { [language: string]: string; }
export type UserLogin = string;
export type Coordinate = { x: number, y: number };
export type Dimensions = { width: number, height: number };

export type Concept = FintoConcept|ConceptSuggestion;

export type Type = ModelType
                 | ClassType
                 | PredicateType
                 | ConceptType
                 | GroupType
                 | 'constraint'
                 | 'user'
                 | 'entity'
                 | 'activity'
                 | 'resource'
                 | 'collection'
                 | 'vocabulary'
                 | 'standard'
                 | 'referenceData'
                 | 'externalReferenceData'
                 | 'referenceDataGroup'
                 | 'referenceDataCode';

export type GroupType = 'group';
export type ModelType = KnownModelType | 'model';
export type KnownModelType = 'library' | 'profile';
export type ClassType = 'class' | 'shape';
export type PredicateType = KnownPredicateType | 'property';
export type KnownPredicateType = 'attribute' | 'association';
export type ConceptType = 'concept' | 'conceptSuggestion';

export type SelectionType = 'class' | 'predicate';

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

interface EntityArrayConstructor<T extends GraphNode, A extends GraphNodes<T>> {
  new(graph: any[], context: any, frame: any): A;
}

type EntityFactory<T extends GraphNode> = (framedData: any) => EntityConstructor<T>;
type EntityArrayFactory<T extends GraphNode, A extends GraphNodes<T>> = (framedData: any) => EntityArrayConstructor<T, A>;

export function isLocalizable(obj: any): obj is Localizable {
  return typeof obj === 'object';
}

export class ExternalEntity {

  id?: Uri;

  constructor(public language: Language, public label: string, public type: ClassType|PredicateType) {
  }

  get normalizedType() {
    return this.type;
  }
}

export interface LanguageContext {
  id: Uri;
  language: Language[];
}

export const frontPageSearchLanguageContext: LanguageContext = {
  id: new Uri('http://iow/frontpage', {}),
  language: availableUILanguages
};

export abstract class GraphNodes<T extends GraphNode> {

  constructor(public context: any, public frame: any) {
  }

  abstract getNodes(): T[];

  serialize(inline: boolean = false, clone: boolean = false): any {

    const values = this.getNodes().map(node => node.serialize(true, clone));

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

  serializationValues(_inline: boolean, _clone: boolean): {} {
    return {};
  }

  serialize(inline: boolean = false, clone: boolean = false): any {
    const values = Object.assign(this.graph, this.serializationValues(inline, clone));

    for (const [key, value] of Object.entries(values)) {
      if (value === null) {
        delete values[key];
      }
    }

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
  prefix?: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    if (typeof graph === 'string' || graph instanceof String) {
      const str = (graph instanceof String) ? graph.valueOf() : graph;
      this.id = new Uri(str, context);
      this.label = createConstantLocalizable(this.id.uri);

    } else if (typeof graph === 'object') {
      this.id = new Uri(graph['@id'], context);
      this.label = deserializeLocalizable(graph.label);
      this.prefix = graph.preferredXMLNamespacePrefix;
    } else {
      throw new Error('Unsupported is defined sub-graph');
    }
  }
}

export abstract class AbstractGroup extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  homepage?: Url;
  normalizedType: GroupType = 'group';
  selectionType: GroupType = 'group';

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
    return groupUrl(this.id.toString());
  }
}

export class GroupListItem extends AbstractGroup {
  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export class Group extends AbstractGroup {

  unsaved = false;
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
  normalizedType: KnownModelType;
  namespace: Url;
  prefix: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    const normalizedType = requireDefined(normalizeModelType(this.type));
    if (normalizedType === 'model') {
      throw new Error('Model type must be known');
    } else {
      this.normalizedType = normalizedType;
    }
    this.namespace = requireDefined(graph['preferredXMLNamespaceName']);
    this.prefix = requireDefined(graph['preferredXMLNamespacePrefix']);
  }

  iowUrl() {
    return modelUrl(this.prefix);
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
  vocabularies: Vocabulary[];
  namespaces: ImportedNamespace[];
  links: Link[];
  referenceDatas: ReferenceData[];
  unsaved: boolean = false;
  group: GroupListItem;
  version?: Urn;
  rootClass: Uri|null;
  language: Language[];
  modifiedAt: Moment|null = null;
  createdAt: Moment|null = null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.comment = deserializeLocalizable(graph.comment);
    this.state = requireDefined(graph.versionInfo);
    if (!graph.isPartOf['@type']) {
      // TODO: Shouldn't be needed but in all cases API doesn't return it
      graph.isPartOf['@type'] = 'foaf:Group';
    }
    this.group = new GroupListItem(graph.isPartOf, context, frame);
    this.vocabularies = deserializeEntityList(graph.references, context, frame, () => Vocabulary);
    this.namespaces = deserializeEntityList(graph.requires, context, frame, () => ImportedNamespace);
    this.links = deserializeEntityList(graph.relations, context, frame, () => Link);
    this.referenceDatas = deserializeEntityList(graph.codeLists, context, frame, () => ReferenceData);
    this.version = graph.identifier;
    this.rootClass = deserializeOptional(graph.rootResource, uri => new Uri(uri, context));
    this.language = deserializeList<Language>(graph.language || ['fi', 'en']);
    this.modifiedAt = deserializeOptional(graph.modified, deserializeDate);
    this.createdAt = deserializeDate(graph.created);
    this.copyNamespacesFromRequires();
  }

  get groupId() {
    return this.group.id;
  }

  addVocabulary(vocabulary: Vocabulary) {
    this.vocabularies.push(vocabulary);
  }

  removeVocabulary(vocabulary: Vocabulary) {
    _.remove(this.vocabularies, vocabulary);
  }

  addNamespace(ns: ImportedNamespace) {
    this.namespaces.push(ns);
  }

  removeNamespace(ns: ImportedNamespace) {
    if (ns.namespaceType !== NamespaceType.TECHNICAL) {
      delete this.context[ns.prefix];
    }
    _.remove(this.namespaces, ns);
  }

  addLink(link: Link) {
    this.links.push(link);
  }

  removeLink(link: Link) {
    _.remove(this.links, link);
  }

  addReferenceData(referenceData: ReferenceData) {
    this.referenceDatas.push(referenceData);
  }

  removeReferenceData(referenceData: ReferenceData) {
    _.remove(this.referenceDatas, referenceData);
  }

  getNamespaces() {
    const namespaces: Namespace[] = [];
    const requiredNamespacePrefixes = new Set<string>();

    namespaces.push(new Namespace(this.prefix, this.namespace, NamespaceType.MODEL));
    requiredNamespacePrefixes.add(this.prefix);

    for (const require of this.namespaces) {
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
      if (contains(namespaceTypes, namespace.type)) {
        result[namespace.prefix] = namespace.url;
      }
    }

    return result;
  }

  private copyNamespacesFromRequires() {
    for (const require of this.namespaces) {
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
    for (const require of this.namespaces) {
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

  isNamespaceKnownAndOfType(namespace: Url, types: NamespaceType[]): boolean  {
    for (const knownNamespace of this.getNamespaces()) {
      if (namespace === knownNamespace.url && containsAny(types, [knownNamespace.type])) {
        return true;
      }
    }
    return false;
  }

  linkToResource(id: Uri|null) {
    if (id && !id.isUrn()) {
      if (this.isNamespaceKnownToBeModel(id.namespace)) {
        return resourceUrl(requireDefined(id.findResolvablePrefix()), id);
      } else {
        return id.url;
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

  serializationValues(_inline: boolean, clone: boolean): {} {
    this.copyNamespacesFromRequires();

    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      versionInfo: this.state,
      references: serializeEntityList(this.vocabularies, clone),
      requires: serializeEntityList(this.namespaces, clone),
      relations: serializeEntityList(this.links, clone),
      codeLists: serializeEntityList(this.referenceDatas, clone),
      identifier: this.version,
      rootResource: this.rootClass && this.rootClass.uri,
      language: serializeList(this.language),
      created: serializeOptional(this.createdAt, serializeDate),
      modified: serializeOptional(this.modifiedAt, serializeDate)
    };
  }
}

export interface Destination {
  id: Uri;
  type: Type[];
  prefix?: string;
  definedBy: DefinedBy|null;
}

export enum NamespaceType {
  IMPLICIT_TECHNICAL, TECHNICAL, MODEL, EXTERNAL
}

export class Namespace {
  constructor(public prefix: string, public url: string, public type: NamespaceType) {
  }
}

export class Link extends GraphNode {

  homepage: Uri;
  title: Localizable;
  description: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.homepage = new Uri(graph.homepage, context);
    this.title = deserializeLocalizable(graph.title);
    this.description = deserializeLocalizable(graph.description);
  }

  serializationValues(): any {
    return {
      homepage: serializeOptional(this.homepage, uri => uri.toString()),
      title: serializeLocalizable(this.title),
      description: serializeLocalizable(this.description)
    };
  }
}

export class Vocabulary extends GraphNode {

  id: Uri;
  title: Localizable;
  description: Localizable;
  vocabularyId?: string;
  isFormatOf?: Url;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.vocabularyId = graph.identifier;
    this.title = deserializeLocalizable(graph.title);
    this.description = deserializeLocalizable(graph.description);
    this.isFormatOf = graph.isFormatOf;
  }

  get local() {
    return this.isOfType('collection');
  }

  get href() {
    return this.isFormatOf || (config.fintoUrl + this.vocabularyId);
  }
}

export class ImportedNamespace extends GraphNode {

  id: Uri;
  label: Localizable;
  private _prefix: string;
  private _namespace: Url;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this._namespace = requireDefined(graph.preferredXMLNamespaceName);
    this.prefix = requireDefined(graph.preferredXMLNamespacePrefix);
  }

  get namespaceType() {
    if (this.isOfType('resource')) {
      return NamespaceType.EXTERNAL;
    } else if (this.isOfType('standard')) {
      return NamespaceType.TECHNICAL;
    } else {
      return NamespaceType.MODEL;
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
    this.id = new Uri(_.trimEnd(ns, '#/'), { [this.prefix]: ns });
  }

  serializationValues(inline: boolean, clone: boolean): {} {

    const onlyIdAndType = inline && !clone && this.namespaceType === NamespaceType.MODEL;

    return {
      '@id': this.id.uri,
      '@type': reverseMapTypeObject(this.type),
      label: onlyIdAndType ? null : serializeLocalizable(this.label),
      preferredXMLNamespaceName: onlyIdAndType ? null : this.namespace,
      preferredXMLNamespacePrefix: onlyIdAndType ? null : this.prefix
    };
  }
}

export class ReferenceDataServer extends GraphNode {
  id: Uri;
  identifier?: string;
  description: Localizable;
  title: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.identifier = graph.identifier;
    this.description = deserializeLocalizable(graph.description);
    this.title = deserializeLocalizable(graph.title);
  }
}

export class ReferenceDataGroup extends GraphNode {
  id: Uri;
  title: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.title = deserializeLocalizable(graph.title);
  }
}

export class ReferenceData extends GraphNode {

  id: Uri;
  title: Localizable;
  description: Localizable;
  creator?: string;
  identifier?: string;
  groups: ReferenceDataGroup[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.title = deserializeLocalizable(graph.title);
    this.description = deserializeLocalizable(graph.description);
    this.creator = graph.creator;
    this.identifier = graph.identifier;
    this.groups = deserializeEntityList(graph.isPartOf, context, frame, () => ReferenceDataGroup);
  }

  isExternal() {
    return this.isOfType('externalReferenceData');
  }

  serializationValues(_inline: boolean, _clone: boolean): {} {
    return {
      '@id': this.id.uri,
      title: serializeLocalizable(this.title),
      description: serializeLocalizable(this.description),
      identifier: this.identifier
    };
  }
}

export class ReferenceDataCode extends GraphNode {

  id: Uri;
  title: Localizable;
  identifier?: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.title = deserializeLocalizable(graph.title);
    this.identifier = graph.identifier;
  }
}

export abstract class AbstractClass extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  selectionType: SelectionType = 'class';
  normalizedType: ClassType;
  definedBy: DefinedBy;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.normalizedType = requireDefined(normalizeClassType(this.type));
    this.definedBy = new DefinedBy(requireDefined(normalizeAsSingle(graph.isDefinedBy, this.id)), context, frame);
  }

  isClass() {
    return true;
  }

  isPredicate() {
    return false;
  }

  iowUrl() {
    return resourceUrl(requireDefined(requireDefined(this.definedBy).prefix), this.id);
  }

  isSpecializedClass() {
    return requireDefined(this.definedBy).isOfType('profile');
  }
}

export class ClassListItem extends AbstractClass {

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export interface VisualizationClass {

  id: Uri;
  type: Type[];
  label: Localizable;
  comment: Localizable;
  scopeClass: Uri|null;
  properties: Property[];
  resolved: boolean;
  associationPropertiesWithTarget: Property[];
  hasAssociationTarget(id: Uri): boolean;
}

export class DefaultVisualizationClass extends GraphNode implements VisualizationClass {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  scopeClass: Uri|null;
  properties: Property[];
  resolved = true;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.scopeClass = deserializeOptional(graph.scopeClass, scopeClass => new Uri(scopeClass, context));
    this.properties = deserializeEntityList(graph.property, context, frame, () => Property);
  }

  get associationPropertiesWithTarget() {
    return _.filter(this.properties, property => property.isAssociation() && property.valueClass);
  }

  hasAssociationTarget(id: Uri) {
    for (const association of this.associationPropertiesWithTarget) {
      if (association.valueClass!.equals(id)) {
        return true;
      }
    }
    return false;
  }
}

export class ModelPositions extends GraphNodes<ClassPosition> {

  private classes: Map<string, ClassPosition>;

  private dirty = false;
  private listeners: (() => void)[] = [];

  constructor(graph: any[], context: any, frame: any) {
    super(context, frame);
    this.classes = indexById(deserializeEntityList(graph, context, frame, () => ClassPosition));
    this.classes.forEach(c => c.parent = this);
  }

  getNodes() {
    return Array.from(this.classes.values());
  }

  addChangeListener(listener: () => void) {
    this.listeners.push(listener);
  }

  setPristine() {
    this.dirty = false;
  }

  setDirty() {
    const wasPristine = !this.dirty;
    this.dirty = true;

    if (wasPristine) {
      this.listeners.forEach(l => l());
    }
  }

  isPristine() {
    return !this.dirty;
  }

  clear() {
    Iterable.forEach(this.classes.values(), c => c.clear());
  }

  resetWith(resetWithPosition: ModelPositions) {

    Iterable.forEach(resetWithPosition.classes.values(), classPosition => {
      const klass = this.classes.get(classPosition.id.toString());
      if (klass) {
        klass.resetWith(classPosition);
      }
    });

    Iterable.forEach(this.classes.values(), classPosition => {
      if (!resetWithPosition.classes.has(classPosition.id.toString())) {
        classPosition.clear();
      }
    });

    this.setPristine();
  }

  changeClassId(oldClassId: Uri, newClassId: Uri) {
    const classPosition = this.getClass(oldClassId);
    classPosition.id = newClassId;
    this.classes.delete(oldClassId.uri);
    this.classes.set(newClassId.uri, classPosition);
  }

  removeClass(classId: Uri) {
    this.getClass(classId).clear();
  }

  isClassDefined(classId: Uri) {
    const classPosition = this.classes.get(classId.uri);
    return classPosition && classPosition.isDefined();
  }

  getClass(classId: Uri) {
    const classPosition = this.classes.get(classId.uri);
    if (classPosition) {
      return classPosition;
    } else {
      return this.newClassPosition(classId);
    }
  }

  getAssociationProperty(classId: Uri, associationPropertyInternalId: Uri) {
    return this.getClass(classId).getAssociationProperty(associationPropertyInternalId);
  }

  private newClassPosition(classId: Uri) {
    const position =  new ClassPosition({ '@id': classId.uri, '@type': reverseMapTypeObject(['class']) }, this.context, this.frame);
    position.parent = this;
    this.classes.set(classId.uri, position);
    return position;
  }

  clone() {
    const serialization = this.serialize(false, true);
    return new ModelPositions(serialization['@graph'], serialization['@context'], this.frame);
  }
}

export class ClassPosition extends GraphNode {

  id: Uri;
  private _coordinate: Coordinate|null;
  associationProperties: Map<string, AssociationPropertyPosition>;
  parent: ModelPositions;
  changeListeners: ((coordinate: Coordinate|null) => void)[] = [];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this._coordinate = deserializeOptional(graph.pointXY, deserializeCoordinate);
    this.associationProperties = indexById(deserializeEntityList(graph.property, context, frame, () => AssociationPropertyPosition));
    this.associationProperties.forEach(p => p.parent = this);
  }

  get coordinate() {
    return this._coordinate;
  }

  setCoordinate(value: Coordinate|null, notify: boolean = true) {
    if (!areEqual(this.coordinate, value, coordinatesAreEqual)) {
      this.setDirty();
    }
    this._coordinate = value;

    if (notify) {
      this.changeListeners.forEach(l => l(value));
    }
  }

  setDirty() {
    if (this.parent) {
      this.parent.setDirty();
    }
  }

  clear() {
    Iterable.forEach(this.associationProperties.values(), p => p.clear());
    this.setCoordinate(null, false);
  }

  resetWith(resetWithPosition: ClassPosition) {
    if (resetWithPosition.isDefined()) {

      Iterable.forEach(resetWithPosition.associationProperties.values(), associationPropertyPosition => {
        const association = this.associationProperties.get(associationPropertyPosition.id.toString());
        if (association) {
          association.resetWith(associationPropertyPosition);
        }
      });

      Iterable.forEach(this.associationProperties.values(), associationPropertyPosition => {
        if (!resetWithPosition.associationProperties.has(associationPropertyPosition.id.toString())) {
          associationPropertyPosition.clear();
        }
      });

      this.setCoordinate(copyCoordinate(resetWithPosition.coordinate));
    }
  }

  isDefined() {
    return isDefined(this.coordinate);
  }

  getAssociationProperty(associationPropertyInternalId: Uri) {

    const associationPosition = this.associationProperties.get(associationPropertyInternalId.uri);

    if (associationPosition) {
      return associationPosition;
    } else {
      return this.newAssociationPosition(associationPropertyInternalId);
    }
  }

  private newAssociationPosition(associationPropertyInternalId: Uri) {
    const position = new AssociationPropertyPosition({ '@id': associationPropertyInternalId.uri }, this.context, this.frame);
    position.parent = this;
    this.associationProperties.set(associationPropertyInternalId.uri, position);
    return position;
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    return {
      '@id': this.id.uri,
      pointXY: serializeOptional(this.coordinate, serializeCoordinate),
      property: serializeEntityList(Array.from(this.associationProperties.values()), clone)
    };
  }
}

export class AssociationPropertyPosition extends GraphNode {

  id: Uri;
  _vertices: Coordinate[];
  parent: ClassPosition;
  changeListeners: ((vertices: Coordinate[]) => void)[] = [];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this._vertices = deserializeList(graph.vertexXY, deserializeCoordinate);
  }

  get vertices() {
    return this._vertices;
  }

  setVertices(value: Coordinate[], notify: boolean = true) {
    if (!arraysAreEqual(this.vertices, value, coordinatesAreEqual)) {
      this.setDirty();
    }
    this._vertices = value;

    if (notify) {
      this.changeListeners.forEach(l => l(value));
    }
  }

  setDirty() {
    if (this.parent) {
      this.parent.setDirty();
    }
  }

  clear() {
    this.setVertices([], false);
  }

  resetWith(resetWithPosition: AssociationPropertyPosition) {
    if (resetWithPosition.isDefined()) {
      this.setVertices(copyVertices(resetWithPosition.vertices));
    }
  }

  isDefined() {
    return this.vertices.length > 0;
  }

  serializationValues(_inline: boolean, _clone: boolean): {} {
    return {
      '@id': this.id.uri,
      vertexXY: serializeList(this.vertices, serializeCoordinate)
    };
  }
}

export class AssociationTargetPlaceholderClass implements VisualizationClass {

  label: Localizable;
  comment: Localizable = {};
  type: Type[] = ['association'];
  properties: Property[] = [];
  resolved = false;
  scopeClass: Uri|null = null;
  associationPropertiesWithTarget: Property[] = [];

  constructor(public id: Uri, model: Model) {
    this.label = createConstantLocalizable(id.compact, model.language);
  }

  hasAssociationTarget(_id: Uri) {
    return false;
  }
}

export class Class extends AbstractClass implements VisualizationClass {

  subClassOf: Uri|null;
  scopeClass: Uri|null;
  state?: State; // External don't have state
  properties: Property[];
  subject: Concept|null;
  equivalentClasses: Uri[];
  constraint: Constraint;
  version?: Urn;
  editorialNote: Localizable;
  modifiedAt: Moment|null;
  createdAt: Moment|null;

  resolved = true;
  unsaved: boolean = false;
  external: boolean = false;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    this.subClassOf = deserializeOptional(graph.subClassOf, subClassOf => new Uri(subClassOf, context));
    this.scopeClass = deserializeOptional(graph.scopeClass, scopeClass => new Uri(scopeClass, context));
    this.state = graph.versionInfo;

    this.properties = deserializeEntityList(graph.property, context, frame, () => Property)
      .sort(comparingNumber<Property>(property => property.index));

    // normalize indices
    for (let i = 0; i < this.properties.length; i++) {
      this.properties[i].index = i;
    }

    this.subject = deserializeOptional(graph.subject, (data) => deserializeEntity(data, context, frame, resolveConceptConstructor));
    this.equivalentClasses = deserializeList(graph.equivalentClass, equivalentClass => new Uri(equivalentClass, context));
    this.constraint = new Constraint(graph.constraint || {}, context, frame);
    this.version = graph.identifier;
    this.editorialNote = deserializeLocalizable(graph.editorialNote);
    this.modifiedAt = deserializeOptional(graph.modified, deserializeDate);
    this.createdAt = deserializeOptional(graph.created, deserializeDate);
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

  get associationPropertiesWithTarget() {
    return _.filter(this.properties, property => property.isAssociation() && property.valueClass);
  }

  hasAssociationTarget(id: Uri) {
    for (const association of this.associationPropertiesWithTarget) {
      if (association.valueClass!.equals(id)) {
        return true;
      }
    }
    return false;
  }

  clone(): Class {
    const serialization = this.serialize(false, true);
    const result = new Class(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    result.external = this.external;
    return result;
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    const isConstraintDefined = (constraint: Constraint) => constraint.items.length > 0 || hasLocalization(constraint.comment);

    return {
      '@id': this.id.uri,
      '@type': reverseMapTypeObject(this.type),
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      subClassOf: this.subClassOf && this.subClassOf.uri,
      scopeClass: this.scopeClass && this.scopeClass.uri,
      versionInfo: this.state,
      isDefinedBy: clone ? serializeEntity(this.definedBy, clone) : this.definedBy.id.toString(),
      property: serializeEntityList(this.properties, clone),
      subject: serializeOptional(this.subject, (data) => serializeEntity(data, clone)),
      equivalentClass: serializeList(this.equivalentClasses, equivalentClass => equivalentClass.uri),
      constraint: serializeOptional(this.constraint, (data) => serializeEntity(data, clone), isConstraintDefined),
      identifier: this.version,
      editorialNote: serializeLocalizable(this.editorialNote),
      created: serializeOptional(this.createdAt, serializeDate),
      modified: serializeOptional(this.modifiedAt, serializeDate)
    };
  }
}

export class Constraint extends GraphNode {

  constraint: ConstraintType;
  items: ConstraintListItem[];
  comment: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    const and = deserializeEntityList(graph.and, context, frame, () => ConstraintListItem);
    const or = deserializeEntityList(graph.or, context, frame, () => ConstraintListItem);
    const not = deserializeEntityList(graph.not, context, frame, () => ConstraintListItem);

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

  serializationValues(_inline: boolean, clone: boolean): {} {
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
    this.label = deserializeLocalizable(graph.label);
  }

  serializationValues(_inline: boolean, _clone: boolean): {} {
    return {
      '@id': this.shapeId.uri
    };
  }
}

export class Property extends GraphNode {

  internalId: Uri;
  externalId?: string;
  state: State;
  label: Localizable;
  comment: Localizable;
  example?: string;
  defaultValue?: string;
  dataType?: DataType;
  language: Language[];
  valueClass: Uri|null = null;
  predicate: Uri|Predicate;
  index: number;
  minCount?: number;
  maxCount?: number;
  minLength?: number;
  maxLength?: number;
  in: string[];
  hasValue?: string;
  pattern?: string;
  referenceData: ReferenceData[];
  predicateType: KnownPredicateType|null= null;
  classIn: Uri[];
  stem: Uri|null;
  editorialNote: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.internalId = new Uri(graph['@id'], context);
    this.externalId = graph.identifier;
    this.state = graph.versionInfo; // XXX: API does not seem to return this but it guaranteed to be set by newProperty logic
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.example = graph.example;
    this.defaultValue = graph.defaultValue;
    this.dataType = graph.datatype;
    this.language = deserializeList<Language>(graph.language);
    this.classIn = deserializeList(graph.classIn, klass => new Uri(klass, context));
    this.referenceData = deserializeEntityList(graph.memberOf, context, frame, () => ReferenceData);

    if (graph.type) {
      const predicateType = requireDefined(mapType(graph.type));

      if (predicateType !== 'association' && predicateType !== 'attribute') {
        throw new Error('Unknown predicate type: ' + predicateType);
      }

      this.predicateType = predicateType;
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
    this.in = deserializeList<string>(graph.inValues);
    this.hasValue = graph.hasValue;
    this.pattern = graph.pattern;
    this.stem = deserializeOptional(graph.stem, stem => new Uri(stem, context));
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

  hasOptionalMetadata() {
    return this.externalId
      || this.example
      || this.in.length > 0
      || this.defaultValue
      || this.hasValue
      || this.pattern
      || this.minLength
      || this.maxLength
      || this.minCount
      || this.maxCount
      || this.referenceData.length > 0;
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

  get normalizedPredicateType(): PredicateType {
    if (this.predicateType) {
      return this.predicateType;
    } else {
      const predicate = this.predicate;
      if (predicate instanceof Predicate) {
        return predicate.normalizedType;
      } else if (this.dataType) {
        return 'attribute';
      } else if (this.valueClass) {
        return 'association';
      } else {
        throw new Error('Cannot resolve predicate type');
      }
    }
  }

  get glyphIconClass() {
    const type = this.normalizedPredicateType;

    if (type === 'association' && !this.hasAssociationTarget()) {
      return glyphIconClassUnknown;
    } else {
      return glyphIconClassForType(type ? [type] : []);
    }
  }

  copy(): Property {
    const clone = this.clone();
    clone.internalId = Uri.randomUUID();
    return clone;
  }

  clone(): Property {
    const serialization = this.serialize(false, true);
    return new Property(serialization['@graph'], serialization['@context'], this.frame);
  }

  serializationValues(_inline: boolean, clone: boolean): {} {

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
      language: serializeList(this.language),
      valueShape: this.valueClass && this.valueClass.uri,
      predicate: serializePredicate(),
      index: this.index,
      minCount: this.minCount,
      maxCount: this.maxCount,
      minLength: this.minLength,
      maxLength: this.maxLength,
      inValues: serializeList(this.in),
      hasValue: this.hasValue,
      pattern: this.pattern,
      classIn: serializeList(this.classIn, classId => classId.uri),
      stem: serializeOptional(this.stem, stem => stem.uri),
      memberOf: serializeEntityList(this.referenceData, clone),
      editorialNote: serializeLocalizable(this.editorialNote)
    };
  }
}

export abstract class AbstractPredicate extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  definedBy: DefinedBy;
  normalizedType: PredicateType;
  selectionType: SelectionType = 'predicate';

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.definedBy = new DefinedBy(requireDefined(normalizeAsSingle(graph.isDefinedBy, this.id)), context, frame);
    this.normalizedType = requireDefined(normalizePredicateType(this.type));
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

  iowUrl() {
    return resourceUrl(requireDefined(this.definedBy.prefix), this.id);
  }
}

export class PredicateListItem extends AbstractPredicate {

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export class Predicate extends AbstractPredicate {

  state?: State; // External don't have state
  subPropertyOf: Uri|null;
  subject: Concept|null;
  equivalentProperties: Uri[];
  version?: Urn;
  editorialNote: Localizable;
  modifiedAt: Moment|null;
  createdAt: Moment|null;

  unsaved: boolean = false;
  external: boolean = false;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.state = graph.versionInfo;
    this.subPropertyOf = deserializeOptional(graph.subPropertyOf, uri => new Uri(uri, context));
    this.subject = deserializeOptional(graph.subject, (data) => deserializeEntity(data, context, frame, resolveConceptConstructor));
    this.equivalentProperties = deserializeList(graph.equivalentProperty, equivalentProperty => new Uri(equivalentProperty, context));
    this.version = graph.identifier;
    this.editorialNote = deserializeLocalizable(graph.editorialNote);
    this.modifiedAt = deserializeOptional(graph.modified, deserializeDate);
    this.createdAt = deserializeOptional(graph.created, deserializeDate);
  }

  get inUnstableState(): boolean {
    return this.state === 'Unstable';
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      isDefinedBy: clone ? serializeEntity(this.definedBy, clone) : this.definedBy.id.toString(),
      versionInfo: this.state,
      subPropertyOf: this.subPropertyOf && this.subPropertyOf.uri,
      subject: serializeOptional(this.subject, (data) => serializeEntity(data, clone)),
      equivalentProperty: serializeList(this.equivalentProperties, equivalentProperty => equivalentProperty.uri),
      identifier: this.version,
      editorialNote: serializeLocalizable(this.editorialNote),
      created: serializeOptional(this.createdAt, serializeDate),
      modified: serializeOptional(this.modifiedAt, serializeDate)
    };
  }
}

export class Association extends Predicate {

  valueClass: Uri|null = null;

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

  serializationValues(inline: boolean, clone: boolean): {} {
    return Object.assign(super.serializationValues(inline, clone), {
      range: this.valueClass && this.valueClass.uri
    });
  }
}

export class Attribute extends Predicate {

  dataType?: DataType;

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

  serializationValues(inline: boolean, clone: boolean): {} {
    return Object.assign(super.serializationValues(inline, clone), {
      range: this.dataType
    });
  }
}

export class FintoConcept extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  vocabularies: (Vocabulary|Uri)[];
  broaderConcept: Concept|null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.prefLabel);
    this.comment = deserializeLocalizable(graph.definition || graph.comment);
    this.vocabularies = deserializeList(graph.inScheme, (data) => deserializeEntityOrId(data, context, frame, () => Vocabulary));
    this.broaderConcept = deserializeOptional(graph.broaderConcept, (data) => deserializeEntity(data, context, frame, resolveConceptConstructor));
  }

  get unsaved() {
    return false;
  }

  get normalizedType(): ConceptType {
    return 'concept';
  }

  get suggestion() {
    return false;
  }

  getVocabularyNames() {
    return _.map(this.vocabularies, vocabulary => new VocabularyNameHref(vocabulary));
  }

  clone(): FintoConcept {
    const serialization = this.serialize(false, true);
    return new FintoConcept(serialization['@graph'], serialization['@context'], this.frame);
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
  vocabulary: Vocabulary|Uri;
  definedBy: DefinedBy|null; // TODO can this really be null?
  broaderConcept: Concept|null;
  createdAt: Moment;
  creator: UserLogin|null; // TODO can this really be null?

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.prefLabel);
    this.comment = deserializeLocalizable(graph.definition);
    this.vocabulary = deserializeEntityOrId(graph.inScheme, context, frame, () => Vocabulary);
    this.definedBy = deserializeOptional(graph.isDefinedBy, (data) => deserializeEntity(data, context, frame, () => DefinedBy));
    this.broaderConcept = deserializeOptional(graph.broaderConcept, (data) => deserializeEntity(data, context, frame, resolveConceptConstructor));
    this.createdAt = deserializeDate(graph.atTime);
    this.creator = deserializeOptional(graph.wasAssociatedWith, deserializeUserLogin);
  }

  get unsaved() {
    return false;
  }

  get normalizedType(): ConceptType {
    return 'conceptSuggestion';
  }

  get suggestion() {
    return true;
  }

  get vocabularies() {
    return [this.vocabulary];
  }

  getVocabularyNames() {
    return [new VocabularyNameHref(this.vocabulary)];
  }

  clone(): ConceptSuggestion {
    const serialization = this.serialize(false, true);
    return new ConceptSuggestion(serialization['@graph'], serialization['@context'], this.frame);
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    return {
      '@id': this.id.uri,
      prefLabel: serializeLocalizable(this.label),
      definition: serializeLocalizable(this.comment),
      inScheme: serializeEntityOrId(this.vocabulary, clone),
      isDefinedBy: serializeOptional(this.definedBy, data => clone ? serializeEntity(data, clone) : data.id.toString()),
      broaderConcept: serializeOptional(this.broaderConcept, data => serializeEntity(data, clone))
    };
  }
}

export class VocabularyNameHref {

  id: Uri;
  href: Url|null;
  name: string|Localizable;

  private static internalVocabularyName = 'Internal vocabulary';

  constructor(vocabulary: Vocabulary|Uri) {
    if (vocabulary instanceof Uri) {
      this.id = vocabulary;
      this.href = vocabulary.uri;
      this.name = vocabulary.uri;
    } else if (vocabulary instanceof Vocabulary) {
      this.id = vocabulary.id;
      this.href = vocabulary.local ? null : vocabulary.href;
      this.name = vocabulary.title;
    } else {
      throw new Error('Unknown vocabulary type: ' + vocabulary);
    }
  }

  getLocalizedName(localizer: Localizer, translator: { getString: (s: string) => string }) {
    const name = this.name;

    if (isLocalizable(name)) {
      return localizer.translate(name);
    } else if (typeof name === 'string') {
      if (name === VocabularyNameHref.internalVocabularyName) {
        return translator.getString(name);
      } else {
        return name;
      }
    } else {
      throw new Error('Unsupported name: ' + name);
    }
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
  modifiedAt: Moment|null;
  adminGroups: Uri[];
  memberGroups: Uri[];
  name?: string;
  login: UserLogin;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.createdAt = deserializeDate(graph.created);
    this.modifiedAt = deserializeOptional(graph.modified, deserializeDate);
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

  isMemberOf(_entity: Model|AbstractGroup) {
    return false;
  }

  isMemberOfGroup(_id: Uri) {
    return false;
  }

  isAdminOf(_entity: Model|AbstractGroup) {
    return false;
  }

  isAdminOfGroup(_id: Uri) {
    return false;
  }
}

export class SearchResult extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  prefix?: string;
  definedBy: DefinedBy|null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.prefix = graph.preferredXMLNamespacePrefix;
    this.definedBy = deserializeOptional(graph.isDefinedBy, (data) => deserializeEntity(data, context, frame, () => DefinedBy));
  }

  iowUrl() {
    return contextlessInternalUrl(this);
  }
}

export interface Usage {
  id: Uri;
  label: Localizable;
  referrers: Referrer[];
}

export class DefaultUsage extends GraphNode implements Usage {

  id: Uri;
  label: Localizable;
  definedBy: DefinedBy|null;
  referrers: Referrer[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.definedBy = deserializeOptional(graph.isDefinedBy, (data) => deserializeEntity(data, context, frame, () => DefinedBy));
    this.referrers = deserializeEntityList(graph.isReferencedBy, context, frame, () => Referrer);
  }
}

export class EmptyUsage implements Usage {

  id: Uri;
  label: Localizable;
  referrers: Referrer[] = [];

  constructor(entity: EditableEntity) {
    this.id = entity.id;
    this.label = entity.label;
  }
}

export class Referrer extends GraphNode {

  id: Uri;
  label: Localizable;
  prefix?: string;
  definedBy: DefinedBy|null;
  normalizedType: Type|null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.prefix = graph.preferredXMLNamespacePrefix;
    this.definedBy = deserializeOptional(graph.isDefinedBy, (data) => deserializeEntity(data, context, frame, () => DefinedBy));
    this.normalizedType = normalizeReferrerType(this.type);
  }

  iowUrl() {
    return contextlessInternalUrl(this);
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
    this.versions = deserializeEntityList(graph.generated, context, frame, () => Entity).sort(comparingDate<Entity>(entity => entity.createdAt));
    this.versionIndex = idToIndexMap(this.versions);
    this.latestVersion = requireDefined(graph.used);
  }

  getVersion(version: Urn): Entity {
    const index = this.versionIndex.get(version);
    return requireDefined(index ? this.versions[index] : null);
  }

  get latest(): Entity {
    return this.getVersion(this.latestVersion);
  }
}

export class Entity extends GraphNode {

  id: Urn;
  createdAt: Moment;
  createdBy: UserLogin;
  previousVersion?: Urn;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.createdAt = deserializeDate(graph.generatedAtTime);
    this.createdBy = deserializeUserLogin(graph.wasAttributedTo);
    this.previousVersion = graph.wasRevisionOf;
  }

  getPrevious(activity: Activity): Entity|null {
    return this.previousVersion ? activity.getVersion(this.previousVersion) : null;
  }
}

function idToIndexMap<T extends {id: Urn}>(items: T[]): Map<Urn, number> {
  return new Map(items.map<[Urn, number]>((item: T, index: number) => [item.id, index]));
}

function resolveConceptConstructor(graph: any): EntityConstructor<Concept> {
  return isConceptSuggestionGraph(graph) ? ConceptSuggestion : FintoConcept;
}

function isConceptSuggestionGraph(withType: { '@type': string|string[] }) {
  return contains(mapGraphTypeObject(withType), 'conceptSuggestion');
}

function deserializeOptional<T>(data: any, deserializer: (data: any) => T) {
  return isDefined(data) ? deserializer(data) : null;
}

function serializeOptional<T>(data: T|null, serializer: (data: T) => any, isDefinedFn: (data: T|null|undefined) => boolean = isDefined) {
  return isDefinedFn(data) ? serializer(data!) : null;
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

function serializeEntity<T extends GraphNode>(entity: T, clone: boolean) {
  return entity.serialize(true, clone);
}

function deserializeEntity<T extends GraphNode>(graph: any, context: any, frame: any, entityFactory: EntityFactory<T>): T {
  const constructor = entityFactory(graph);
  return new constructor(graph, context, frame);
}

function serializeEntityOrId(data: GraphNode|Uri, clone: boolean) {
  if (data instanceof GraphNode) {
    return serializeEntity(data, clone);
  } else if (data instanceof Uri) {
    return data.uri;
  } else {
    throw new Error('Item must be instance of GraphNode or Uri');
  }
}

function deserializeEntityOrId<T extends GraphNode>(data: any, context: any, frame: any, entityFactory: EntityFactory<T>): T|Uri {
  if (typeof data === 'object') {
    return deserializeEntity(data, context, frame, entityFactory);
  } else if (typeof data === 'string') {
    return new Uri(data, context);
  } else {
    throw new Error('Incompatible data for entity or id: ' + data);
  }
}

function serializeEntityList(list: GraphNode[], clone: boolean) {
  return serializeList(list, listItem => serializeEntity(listItem, clone));
}

function deserializeEntityList<T extends GraphNode>(list: any, context: any, frame: any, entityFactory: EntityFactory<T>): T[] {
  return deserializeList<T>(list, graph => deserializeEntity(graph, context, frame, entityFactory));
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

function serializeDate(date: Moment) {
  return date.format(isoDateFormat);
}

function deserializeDate(date: any) {
  return moment(date, isoDateFormat);
}

function serializeCoordinate(coordinate: Coordinate) {
  return coordinate.x + ',' + coordinate.y;
}

function deserializeCoordinate(coordinate: string): Coordinate {
  const split = coordinate.split(',');
  if (split.length !== 2) {
    throw new Error('Misformatted coordinate: ' + coordinate);
  }
  return { x: parseInt(split[0], 10), y: parseInt(split[1], 10) };
}

function deserializeUserLogin(userName: string): UserLogin {
  return userName.substring('mailto:'.length);
}

function coordinatesAreEqual(lhs: Coordinate, rhs: Coordinate) {
  return lhs.x === rhs.x && lhs.y === rhs.y;
}

function mapGraphTypeObject(withType: { '@type': string|string[] }): Type[] {
  return filterDefined(normalizeAsArray(withType['@type']).map(mapType));
}

function reverseMapTypeObject(types: Type[]): string[] {
  return filterDefined(types.map(reverseMapType));
}

export function modelUrl(prefix: string): RelativeUrl {
  return `/model/${prefix}` + '/';
}

export function resourceUrl(modelPrefix: string, resource: Uri) {
  const resourcePrefix = resource.findPrefix();
  const linked = isDefined(resourcePrefix) && resourcePrefix !== modelPrefix;
  return modelUrl(modelPrefix) +  (linked ? resource.curie : resource.name) + '/';
}

function contextlessInternalUrl(destination: Destination) {
  if (destination) {
    if (containsAny(destination.type, ['model', 'profile'])) {
      return modelUrl(requireDefined(destination.prefix));
    } else if (containsAny(destination.type, ['group'])) {
      return groupUrl(destination.id.uri);
    } else if (containsAny(destination.type, ['association', 'attribute', 'class', 'shape'])) {
      return resourceUrl(requireDefined(requireDefined(destination.definedBy).prefix), destination.id);
    } else {
      throw new Error('Unsupported type for url: ' + destination.type);
    }
  } else {
    return null;
  }
}

export function groupUrl(id: string): RelativeUrl {
  return `/group?id=${encodeURIComponent(id)}`;
}

function frameData($log: ILogService, data: GraphData, frame: any): IPromise<GraphData> {
  return jsonld.promises.frame(data, frame)
    .then((framed: any) => framed, (err: any) => {
      $log.error(frame);
      $log.error(data);
      $log.error(err.message);
      $log.error(err.details.cause);
    });
}


function frameAndMap<T extends GraphNode>($log: ILogService, data: GraphData, optional: boolean, frame: Frame, entityFactory: EntityFactory<T>): IPromise<T> {

  return frameData($log, data, frame)
    .then(framed => {
      try {
        if (optional && framed['@graph'].length === 0) {
          return null;
        } else if (framed['@graph'].length > 1) {
          throw new Error('Multiple graphs found: \n' + JSON.stringify(framed, null, 2));
        } else {
          const entity: EntityConstructor<T> = entityFactory(framed);
          return new entity(framed['@graph'][0], framed['@context'], frame);
        }
      } catch (error) {
        $log.error(error);
        throw error;
      }
    });
}

function frameAndMapArray<T extends GraphNode>($log: ILogService, data: GraphData, frame: Frame, entityFactory: EntityFactory<T>): IPromise<T[]> {

  return frameData($log, data, frame)
    .then(framed => {
      try {
        return _.map(normalizeAsArray(framed['@graph']), element => {
          const entity: EntityConstructor<T> = entityFactory(element);
          return new entity(element, framed['@context'], frame);
        });
      } catch (error) {
        $log.error(error);
        throw error;
      }
    });
}

function frameAndMapArrayEntity<T extends GraphNode, A extends GraphNodes<T>>($log: ILogService, data: GraphData, frame: Frame, entityArrayFactory: EntityArrayFactory<T, A>): IPromise<A> {

  return frameData($log, data, frame)
    .then(framed => {
      try {
        const entity: EntityArrayConstructor<T, A> = entityArrayFactory(framed);
        return new entity(framed['@graph'], framed['@context'], frame);
      } catch (error) {
        $log.error(error);
        throw error;
      }
    });
}

export class EntityDeserializer {
  /* @ngInject */
  constructor(private $log: ILogService) {
  }

  deserializeGroupList(data: GraphData): IPromise<GroupListItem[]> {
    return frameAndMapArray(this.$log, data, frames.groupListFrame(data), () => GroupListItem);
  }

  deserializeGroup(data: GraphData): IPromise<Group> {
    return frameAndMap(this.$log, data, true, frames.groupFrame(data), () => Group);
  }

  deserializeModelList(data: GraphData): IPromise<ModelListItem[]> {
    return frameAndMapArray(this.$log, data, frames.modelListFrame(data), () => ModelListItem);
  }

  deserializeModel(data: GraphData): IPromise<Model> {
    return frameAndMap(this.$log, data, true, frames.modelFrame(data), () => Model);
  }

  deserializeModelById(data: GraphData, id: Uri|Urn): IPromise<Model> {
    return frameAndMap(this.$log, data, true, frames.modelFrame(data, {id}), () => Model);
  }

  deserializeModelByPrefix(data: GraphData, prefix: string): IPromise<Model> {
    return frameAndMap(this.$log, data, true, frames.modelFrame(data, {prefix}), () => Model);
  }

  deserializeClassList(data: GraphData): IPromise<ClassListItem[]> {
    return frameAndMapArray(this.$log, data, frames.classListFrame(data), () => ClassListItem);
  }

  deserializeClass(data: GraphData): IPromise<Class> {
    return frameAndMap(this.$log, data, true, frames.classFrame(data), () => Class);
  }

  deserializeProperty(data: GraphData): IPromise<Property> {
    return frameAndMap(this.$log, data, true, frames.propertyFrame(data), () => Property);
  }

  deserializePredicateList(data: GraphData): IPromise<PredicateListItem[]> {
    return frameAndMapArray(this.$log, data, frames.predicateListFrame(data), () => PredicateListItem);
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

    return frameAndMap(this.$log, data, true, frames.predicateFrame(data), entityFactory);
  }

  deserializeConceptSuggestion(data: GraphData): IPromise<ConceptSuggestion> {
    return frameAndMap(this.$log, data, true, frames.iowConceptFrame(data), () => ConceptSuggestion);
  }

  deserializeConceptSuggestions(data: GraphData): IPromise<ConceptSuggestion[]> {
    return frameAndMapArray(this.$log, data, frames.iowConceptFrame(data), () => ConceptSuggestion);
  }

  deserializeFintoConcept(data: GraphData, id: Url): IPromise<FintoConcept> {
    return frameAndMap(this.$log, data, true, frames.fintoConceptFrame(data, id), () => FintoConcept);
  }

  deserializeFintoConceptSearchResults(data: GraphData): IPromise<FintoConceptSearchResult[]> {
    return frameAndMapArray(this.$log, data, frames.fintoConceptSearchResultsFrame(data), () => FintoConceptSearchResult);
  }

  deserializeConcepts(data: GraphData): IPromise<Concept[]> {
    return frameAndMapArray(this.$log, data, frames.iowConceptFrame(data), resolveConceptConstructor);
  }

  deserializeVocabularies(data: GraphData): IPromise<Vocabulary[]> {
    return frameAndMapArray(this.$log, data, frames.vocabularyFrame(data), () => Vocabulary);
  }

  deserializeImportedNamespace(data: GraphData): IPromise<ImportedNamespace> {
    return frameAndMap(this.$log, data, true, frames.namespaceFrame(data), () => ImportedNamespace);
  }

  deserializeImportedNamespaces(data: GraphData): IPromise<ImportedNamespace[]> {
    return frameAndMapArray(this.$log, data, frames.namespaceFrame(data), () => ImportedNamespace);
  }

  deserializeReferenceDataServers(data: GraphData): IPromise<ReferenceDataServer[]> {
    return frameAndMapArray(this.$log, data, frames.referenceDataServerFrame(data), () => ReferenceDataServer);
  }

  deserializeReferenceData(data: GraphData): IPromise<ReferenceData> {
    return frameAndMap(this.$log, data, true, frames.referenceDataFrame(data), () => ReferenceData);
  }

  deserializeReferenceDatas(data: GraphData): IPromise<ReferenceData[]> {
    return frameAndMapArray(this.$log, data, frames.referenceDataFrame(data), () => ReferenceData);
  }

  deserializeReferenceDataCodes(data: GraphData): IPromise<ReferenceDataCode[]> {
    return frameAndMapArray(this.$log, data, frames.referenceDataCodeFrame(data), () => ReferenceDataCode);
  }

  deserializeUser(data: GraphData): IPromise<User> {
    return frameAndMap(this.$log, data, true, frames.userFrame(data), () => DefaultUser);
  }

  deserializeSearch(data: GraphData): IPromise<SearchResult[]> {
    return frameAndMapArray(this.$log, data, frames.searchResultFrame(data), () => SearchResult);
  }

  deserializeModelVisualization(data: GraphData): IPromise<VisualizationClass[]> {
    return frameAndMapArray(this.$log, data, frames.classVisualizationFrame(data), () => DefaultVisualizationClass);
  }

  deserializeModelPositions(data: GraphData): IPromise<ModelPositions> {
    return frameAndMapArrayEntity(this.$log, data, frames.modelPositionsFrame(data), () => ModelPositions);
  }

  deserializeUsage(data: GraphData): IPromise<Usage> {
    return frameAndMap(this.$log, data, true, frames.usageFrame(data), () => DefaultUsage);
  }

  deserializeVersion(data: GraphData): IPromise<Activity> {
    return frameAndMap(this.$log, data, true, frames.versionFrame(data), () => Activity);
  }
}
