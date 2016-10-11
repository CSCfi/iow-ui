import { normalizePredicateType, SelectionType, PredicateType, State } from './type';
import { requireDefined } from '../utils/object';
import { resourceUrl, resolveConceptConstructor } from '../utils/entity';
import { Uri, Urn } from '../entities/uri';
import { DefinedBy } from './definedBy';
import { Localizable } from './contract';
import { Moment } from 'moment';
import { DataType } from './dataTypes';
import { Concept } from './vocabulary';
import { init, serialize } from './mapping';
import { GraphNode } from './graphNode';
import {
  uriSerializer, entityAwareList, entity,
  entityAwareOptional
} from './serializer/entitySerializer';
import { localizableSerializer, dateSerializer, optional, identitySerializer } from './serializer/serializer';
import { normalizingDefinedBySerializer } from './serializer/common';

export abstract class AbstractPredicate extends GraphNode {

  static abstractPredicateMappings = {
    id: { name: '@id', serializer: uriSerializer },
    label: { name: 'label', serializer: localizableSerializer },
    comment: { name: 'comment', serializer: localizableSerializer },
    definedBy: { name: 'isDefinedBy', serializer: normalizingDefinedBySerializer }
  };

  id: Uri;
  label: Localizable;
  comment: Localizable;
  definedBy: DefinedBy;

  normalizedType: PredicateType;
  selectionType: SelectionType = 'predicate';

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, AbstractPredicate.abstractPredicateMappings);
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

  static predicateMappings = {
    state:                { name: 'versionInfo',        serializer: optional(identitySerializer<State>()) },
    subPropertyOf:        { name: 'subPropertyOf',      serializer: entityAwareOptional(uriSerializer) },
    subject:              { name: 'subject',            serializer: entityAwareOptional(entity(resolveConceptConstructor)) },
    equivalentProperties: { name: 'equivalentProperty', serializer: entityAwareList(uriSerializer) },
    version:              { name: 'identifier',         serializer: optional(identitySerializer<Urn>()) },
    editorialNote:        { name: 'editorialNote',      serializer: localizableSerializer },
    modifiedAt:           { name: 'modified',           serializer: optional(dateSerializer) },
    createdAt:            { name: 'created',            serializer: optional(dateSerializer) }
  };

  state: State|null; // External don't have state
  subPropertyOf: Uri|null;
  subject: Concept|null;
  equivalentProperties: Uri[];
  version: Urn|null;
  editorialNote: Localizable;
  modifiedAt: Moment|null;
  createdAt: Moment|null;

  unsaved: boolean = false;
  external: boolean = false;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Predicate.predicateMappings);
  }

  get inUnstableState(): boolean {
    return this.state === 'Unstable';
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    return serialize(this, clone, Object.assign({}, AbstractPredicate.abstractPredicateMappings, Predicate.predicateMappings));
  }
}

export class Association extends Predicate {

  static associationMappings = {
    valueClass: { name: 'range', serializer: entityAwareOptional(uriSerializer) }
  };

  valueClass: Uri|null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Association.associationMappings);
  }

  clone(): Association {
    const serialization = this.serialize(false, true);
    const result = new Association(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    result.external = this.external;
    return result;
  }

  serializationValues(inline: boolean, clone: boolean): {} {
    return Object.assign(super.serializationValues(inline, clone), serialize(this, clone, Association.associationMappings));
  }
}

export class Attribute extends Predicate {

  static attributeMappings = {
    dataType: { name: 'range', serializer: optional(identitySerializer<DataType>()) }
  };

  dataType: DataType|null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Attribute.attributeMappings);
  }

  clone(): Attribute {
    const serialization = this.serialize(false, true);
    const result = new Attribute(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    result.external = this.external;
    return result;
  }

  serializationValues(inline: boolean, clone: boolean): {} {
    return Object.assign(super.serializationValues(inline, clone), serialize(this, clone, Attribute.attributeMappings));
  }
}
