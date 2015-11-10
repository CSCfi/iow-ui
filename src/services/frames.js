const _ = require('lodash');

const label = { '@id': 'http://www.w3.org/2000/01/rdf-schema#label', '@container': '@language' };
const title = { '@id': 'http://purl.org/dc/terms/title', '@container': '@language' };
const comment = { '@id': 'http://www.w3.org/2000/01/rdf-schema#comment', '@container': '@language' };
const example = { '@id': 'http://www.w3.org/2004/02/skos/core#example', '@container': '@language' };
const prefLabel = { '@id': 'http://www.w3.org/2004/02/skos/core#prefLabel', '@container': '@language' };
const datatype = { '@id': 'http://www.w3.org/ns/shacl#datatype', '@type': '@id' };
const subClassOf = { '@id': 'http://www.w3.org/2000/01/rdf-schema#subClassOf', '@type': '@id' };
const property = { '@id': 'http://www.w3.org/ns/shacl#property', '@type': '@id' };
const modified = { '@id': 'http://purl.org/dc/terms/modified', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' };
const isDefinedBy = { '@id': 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', '@type': '@id' };
const predicate = { '@id': 'http://www.w3.org/ns/shacl#predicate', '@type': '@id' };
const valueClass = { '@id': 'http://www.w3.org/ns/shacl#valueClass', '@type': '@id' };
const nodeKind = { '@id': 'http://www.w3.org/ns/shacl#nodeKind', '@type': '@id' };
const references = { '@id': 'http://purl.org/dc/terms/references', '@type': '@id' };
const requires = { '@id': 'http://purl.org/dc/terms/requires', '@type': '@id' };
const imports = { '@id': 'http://www.w3.org/2002/07/owl#imports', '@type': '@id' };
const versionInfo = { '@id': 'http://www.w3.org/2002/07/owl#versionInfo' };
const hasPart = { '@id': 'http://purl.org/dc/terms/hasPart', '@type': '@id' };
const preferredXMLNamespaceName = { '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespaceName', '@type': 'http://www.w3.org/2001/XMLSchema#string' };
const preferredXMLNamespacePrefix = { '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespacePrefix', '@type': 'http://www.w3.org/2001/XMLSchema#string' };
const identifier = { '@id': 'http://purl.org/dc/terms/identifier', '@type': 'http://www.w3.org/2001/XMLSchema#string' };
const range = { '@id': 'http://www.w3.org/2000/01/rdf-schema#range', '@type': '@id' };
const subject = { '@id': 'http://purl.org/dc/terms/subject', '@type': '@id' };
const isPartOf = { '@id': 'http://purl.org/dc/terms/isPartOf', '@type': '@id' };

function addToContext(context, values) {
  return _.chain(context)
    .clone()
    .assign(values)
    .value();
}

function groupListFrame(data) {
  return {
    '@context': addToContext(data['@context'], {label})
  };
}

function modelFrame(data) {
  const contextValues = {
    label,
    comment,
    title,
    example,
    prefLabel,
    references,
    requires,
    imports,
    hasPart,
    preferredXMLNamespaceName,
    preferredXMLNamespacePrefix,
    identifier,
    range,
    subClassOf,
    property,
    subject,
    datatype,
    predicate,
    valueClass,
    nodeKind,
    versionInfo
  };

  return {
    '@context': addToContext(data['@context'], contextValues),
    '@type': 'owl:Ontology'
  };
}

function modelListFrame(data) {
  return {
    '@context': addToContext(data['@context'], {label, isPartOf, identifier}),
    '@type': 'sd:NamedGraph'
  };
}

function propertyFrame(data) {
  return {
    '@context': addToContext(data['@context'], {label, range, datatype, valueClass, modified, isDefinedBy, comment, predicate}),
    '@id': data['@id']
  };
}

function predicateListFrame(data) {
  return {
    '@context': addToContext(data['@context'], {label, range, modified, isDefinedBy, comment}),
    isDefinedBy: {}
  };
}

function predicateFrame(data) {
  return {
    '@context': addToContext(data['@context'], {label, range, datatype, valueClass, modified, isDefinedBy, comment, subject, versionInfo}),
    'isDefinedBy': {},
    'subject': {
      '@omitDefault': true,
      '@default': []
    }
  };
}

function classFrame(data) {
  const contextValues = {
    comment,
    label,
    prefLabel,
    subClassOf,
    property,
    modified,
    isDefinedBy,
    predicate,
    valueClass,
    nodeKind,
    example,
    datatype,
    versionInfo
  };

  return {
    '@context': addToContext(data['@context'], contextValues),
    '@type': 'sh:ShapeClass',
    isDefinedBy: {}
  };
}

function classListFrame(data) {
  const frame = classFrame(data);
  frame.isDefinedBy = {};
  return frame;
}

function conceptSuggestionFrame(data) {
  return {
    '@context': addToContext(data['@context'], {label, comment}),
    inScheme: {}
  };
}

module.exports = {
  groupListFrame,
  modelFrame,
  modelListFrame,
  classFrame,
  classListFrame,
  propertyFrame,
  predicateFrame,
  predicateListFrame,
  conceptSuggestionFrame
};
