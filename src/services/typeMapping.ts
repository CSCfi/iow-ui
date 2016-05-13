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
registerType('scheme', ['skos:ConceptScheme']);
registerType('entity', ['prov:Entity']);
registerType('activity', ['prov:Activity']);
registerType('resource', ['rdfs:Resource']);
registerType('collection', ['skos:Collection']);
registerType('standard', ['dcterms:Standard']);
registerType('codeScheme', ['iow:FCodeScheme']);
registerType('externalCodeScheme', ['dcam:VocabularyEncodingScheme']);
registerType('codeGroup', ['iow:FCodeGroup']);
registerType('code', ['iow:FCode']);

export function mapType(type: string): Type {
  const result = toType.get(type);
  if (!result) {
    console.log('Unknown type not mapped: ' + type);
  }
  return result;
}

export function reverseMapType(type: Type): string {
  const result = fromType.get(type);
  if (!result) {
    console.log('Unknown type not mapped: ' + type);
  } else if (result.length !== 1) {
    throw new Error(`Cannot map '${type}' because is not bijection: '${result}'`);
  }

  return result[0];
}
