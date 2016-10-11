import { config } from '../config';
import {
  localizableSerializer, dateSerializer,
  optional, userLoginSerializer, stringSerializer, identitySerializer
} from './serializer/serializer';
import { Uri, Url } from '../services/uri';
import { Localizable, UserLogin } from './contract';
import { resolveConceptConstructor, glyphIconClassForType, isLocalizable } from '../utils/entity';
import { ConceptType } from './type';
import { DefinedBy } from './definedBy';
import { Moment } from 'moment';
import { Localizer } from '../utils/language';
import { init, serialize } from './mapping';
import { GraphNode } from './graphNode';
import { uriSerializer, entityAwareList, entityOrId, entity, entityAwareOptional } from './serializer/entitySerializer';

export class Vocabulary extends GraphNode {

  static vocabularyMappings = {
    id:           { name: '@id',         serializer: uriSerializer },
    title:        { name: 'title',       serializer: localizableSerializer },
    description:  { name: 'description', serializer: localizableSerializer },
    vocabularyId: { name: 'identifier',  serializer: optional(stringSerializer) },
    isFormatOf:   { name: 'isFormatOf',  serializer: optional(identitySerializer<Url>()) }
  };

  id: Uri;
  title: Localizable;
  description: Localizable;
  vocabularyId?: string;
  isFormatOf?: Url;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Vocabulary.vocabularyMappings);
  }

  get local() {
    return this.isOfType('collection');
  }

  get href() {
    return this.isFormatOf || (config.fintoUrl + this.vocabularyId);
  }
}

export type Concept = FintoConcept|ConceptSuggestion;

export class FintoConcept extends GraphNode {

  static fintoConceptMappings = {
    id:             { name: '@id',            serializer: uriSerializer },
    label:          { name: 'prefLabel',      serializer: localizableSerializer },
    comment:        { name: 'definition',     serializer: localizableSerializer },
    vocabularies:   { name: 'inScheme',       serializer: entityAwareList(entityOrId(entity(() => Vocabulary))) },
    broaderConcept: { name: 'broaderConcept', serializer: entityAwareOptional(entity(resolveConceptConstructor)) }
  };

  id: Uri;
  label: Localizable;
  comment: Localizable;
  vocabularies: (Vocabulary|Uri)[];
  broaderConcept: Concept|null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, FintoConcept.fintoConceptMappings);
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

  get glyphIconClass() {
    return glyphIconClassForType(['concept']);
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
    this.label = localizableSerializer.deserialize(graph.prefLabel);
  }
}

export class ConceptSuggestion extends GraphNode {

  static conceptSuggestionMappings = {
    id:             { name: '@id',               serializer: uriSerializer },
    label:          { name: 'prefLabel',         serializer: localizableSerializer },
    comment:        { name: 'definition',        serializer: localizableSerializer },
    vocabulary:     { name: 'inScheme',          serializer: entityOrId(entity(() => Vocabulary)) },
    broaderConcept: { name: 'broaderConcept',    serializer: entityAwareOptional(entity(resolveConceptConstructor)) },
    createdAt:      { name: 'atTime',            serializer: dateSerializer },
    creator:        { name: 'wasAssociatedWith', serializer: optional(userLoginSerializer) }
  };

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
    init(this, ConceptSuggestion.conceptSuggestionMappings);
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

  get glyphIconClass() {
    return glyphIconClassForType(this.type);
  }

  getVocabularyNames() {
    return [new VocabularyNameHref(this.vocabulary)];
  }

  clone(): ConceptSuggestion {
    const serialization = this.serialize(false, true);
    return new ConceptSuggestion(serialization['@graph'], serialization['@context'], this.frame);
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    return serialize(this, clone, ConceptSuggestion.conceptSuggestionMappings);
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
