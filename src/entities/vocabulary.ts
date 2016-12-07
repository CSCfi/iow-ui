import {
  localizableSerializer,
  stringSerializer
} from './serializer/serializer';
import { Uri } from '../entities/uri';
import { Localizable } from './contract';
import { glyphIconClassForType } from '../utils/entity';
import { init, serialize } from './mapping';
import { GraphNode } from './graphNode';
import { uriSerializer, entity, entityAwareOptional, entityAwareList } from './serializer/entitySerializer';
import { ConceptType } from './type';
import { normalizeAsArray, contains } from '../utils/array';

export class Material extends GraphNode {

  static materialMappings = {
    id:           { name: '@id',   serializer: uriSerializer },
    internalId:   { name: 'id',    serializer: stringSerializer },
    code:         { name: 'code',  serializer: stringSerializer }
  };

  id: Uri;
  internalId: string;
  code: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Material.materialMappings);
  }

  get href() {
    return `http://termed.csc.fi/#/graphs/${this.internalId}`;
  }
}

export class Vocabulary extends GraphNode {

  static vocabularyMappings = {
    id:           { name: '@id',         serializer: uriSerializer },
    internalId:   { name: 'id',          serializer: stringSerializer },
    material:     { name: 'graph',       serializer: entity(() => Material) },
    title:        { name: 'title',       serializer: localizableSerializer },
    description:  { name: 'definition',  serializer: localizableSerializer }
  };

  id: Uri;
  internalId: string;
  material: Material;
  title: Localizable;
  description: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Vocabulary.vocabularyMappings);
  }

  get href() {
    return `http://termed.csc.fi/#/graphs/${this.material.internalId}/types/ConceptScheme/nodes/${this.internalId}`;
  }
}

export class Concept extends GraphNode {

  static conceptMappings = {
    id:             { name: '@id',               serializer: uriSerializer },
    internalId:     { name: 'id',                serializer: stringSerializer },
    label:          { name: 'prefLabel',         serializer: localizableSerializer },
    comment:        { name: 'definition',        serializer: localizableSerializer },
    vocabularies:   { name: 'inScheme',          serializer: entityAwareList(entity(() => Vocabulary)) },
    material:       { name: 'graph',             serializer: entity(() => Material) },
    broaderConcept: { name: 'broader',           serializer: entityAwareOptional(entity(() => Concept)) }
  };

  id: Uri;
  internalId: string;
  label: Localizable;
  comment: Localizable;
  vocabularies: Vocabulary[];
  material: Material;
  broaderConcept: Concept|null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Concept.conceptMappings);
  }

  get normalizedType(): ConceptType {
    return 'concept';
  }

  get suggestion() {
    return false; // TODO flag for concept suggestion?
  }

  get unsaved() {
    return false;
  }

  get href() {
    return `http://termed.csc.fi/#/graphs/${this.material.internalId}/types/Concept/nodes/${this.internalId}`;
  }

  get glyphIconClass() {
    return glyphIconClassForType(this.type);
  }

  get legacy() {
    return false;
  }

  clone(): Concept {
    const serialization = this.serialize(false, true);
    return new Concept(serialization['@graph'], serialization['@context'], this.frame);
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    return serialize(this, clone, Concept.conceptMappings);
  }
}

export class LegacyConcept extends GraphNode {

  static conceptMappings = {
    id:             { name: '@id',               serializer: uriSerializer },
    label:          { name: 'prefLabel',         serializer: localizableSerializer },
    comment:        { name: 'definition',        serializer: localizableSerializer }
  };

  id: Uri;
  label: Localizable;
  comment: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, LegacyConcept.conceptMappings);
  }

  get suggestion() {
    return !this.isOfType('concept');
  }

  get legacy() {
    return true;
  }

  get unsaved() {
    return false;
  }

  get normalizedType(): ConceptType {
    return 'concept';
  }

  clone(): LegacyConcept {
    const serialization = this.serialize(false, true);
    return new LegacyConcept(serialization['@graph'], serialization['@context'], this.frame);
  }

  get glyphIconClass() {
    return glyphIconClassForType(['concept']);
  }
}
