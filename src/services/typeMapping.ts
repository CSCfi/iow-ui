import { Type } from './entities';

const fromType = new Map<Type, string[]>();
const toType = new Map<string, Type>();

function registerType(type: Type, rdfTypes: string[]) {
  fromType.set(type, rdfTypes);
  for (const rdfType of rdfTypes) {
    toType.set(rdfType, type);
  }
}

registerType('class', ['rdfs:Class']);
registerType('shape', ['sh:Shape']);
registerType('attribute', ['owl:DatatypeProperty']);
registerType('association', ['owl:ObjectProperty']);
registerType('property', ['rdf:Property']);
registerType('model', ['owl:Ontology']);
registerType('profile', ['dcap:DCAP']);
registerType('group', ['foaf:Group']);
registerType('library', ['dcap:MetadataVocabulary']);
registerType('constraint', ['sh:AbstractOrNodeConstraint', 'sh:AbstractAndNodeConstraint', 'sh:AbstractNotNodeConstraint']);
registerType('user', ['foaf:Person']);
registerType('concept', ['skos:Concept']);
registerType('conceptSuggestion', ['iow:ConceptSuggestion']);
registerType('vocabulary', ['skos:ConceptScheme']);
registerType('entity', ['prov:Entity']);
registerType('activity', ['prov:Activity']);
registerType('resource', ['rdfs:Resource']);
registerType('collection', ['skos:Collection']);
registerType('standard', ['dcterms:Standard']);
registerType('referenceData', ['iow:FCodeScheme']);
registerType('externalReferenceData', ['dcam:VocabularyEncodingScheme']);
registerType('referenceDataGroup', ['iow:FCodeGroup']);
registerType('referenceDataCode', ['iow:FCode']);

export function mapType(type: string): Type|null {
  const result = toType.get(type);
  if (!result) {
    console.log('Unknown type not mapped: ' + type);
  }
  return result || null;
}

export function reverseMapType(type: Type): string|null {
  const result = fromType.get(type);
  if (!result) {
    console.log('Unknown type not mapped: ' + type);
    return null;
  } else if (result.length !== 1) {
    throw new Error(`Cannot map '${type}' because is not bijection: '${result}'`);
  } else {
    return result[0];
  }
}
