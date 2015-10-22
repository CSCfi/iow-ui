const _ = require('lodash');

const label = { '@id': 'http://www.w3.org/2000/01/rdf-schema#label', '@container': '@language' };
const title = { '@id': 'http://purl.org/dc/terms/title', '@container': '@language' };
const comment = { '@id': 'http://www.w3.org/2000/01/rdf-schema#comment', '@container': '@language' };
const example = { '@id': 'http://www.w3.org/2004/02/skos/core#example', '@container': '@language' };
const prefLabel = { '@id': 'http://www.w3.org/2004/02/skos/core#prefLabel', '@container': '@language' };
const dataType = { '@id': 'http://www.w3.org/ns/shacl#datatype', '@type': '@id' };
const subClassOf = { '@id': 'http://www.w3.org/2000/01/rdf-schema#subClassOf', '@type': '@id' };
const property = { '@id': 'http://www.w3.org/ns/shacl#property', '@type': '@id' };
const modified = { '@id': 'http://purl.org/dc/terms/modified', '@type': 'http://www.w3.org/2001/XMLSchema#string' };
const isDefinedBy = { '@id': 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', '@type': '@id' };
const predicate = { '@id': 'http://www.w3.org/ns/shacl#predicate', '@type': '@id' };
const valueClass = { '@id': 'http://www.w3.org/ns/shacl#valueClass', '@type': '@id' };
const nodeKind = { '@id': 'http://www.w3.org/ns/shacl#nodeKind', '@type': '@id' };
const references = { '@id': 'http://purl.org/dc/terms/references', '@type': '@id' };
const requires = { '@id': 'http://purl.org/dc/terms/requires', '@type': '@id' };
const associations = { '@id': 'http://urn.fi/urn:nbn:fi:csc-iow-meta#associations', '@type': '@id' };
const attributes = { '@id': 'http://urn.fi/urn:nbn:fi:csc-iow-meta#attributes', '@type': '@id' };
const classes = { '@id': 'http://urn.fi/urn:nbn:fi:csc-iow-meta#classes', '@type': '@id' };
const imports = { '@id': 'http://www.w3.org/2002/07/owl#imports', '@type': '@id' };
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

function modelFrame(data) {
  const contextValues = {
    label,
    comment,
    title,
    example,
    prefLabel,
    references,
    requires,
    associations,
    attributes,
    classes,
    imports,
    hasPart,
    preferredXMLNamespaceName,
    preferredXMLNamespacePrefix,
    identifier,
    range,
    subClassOf,
    property,
    subject,
    dataType,
    predicate,
    valueClass,
    nodeKind
  };

  return {
    '@context': addToContext(data['@context'], contextValues),
    imports: {'@embed': false},
    classes: {
      property: {
        predicate: {
          '@embed': false
        },
        valueClass: {
          '@omitDefault': true,
          '@default': [],
          '@embed': false
        }
      }
    }
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
    '@context': addToContext(data['@context'], {label, range, modified, isDefinedBy}),
    '@type': 'owl:DatatypeProperty'
  };
}

function predicateFrame(data) {
  return {
    '@context': addToContext(data['@context'], {label, range, modified, isDefinedBy}),
    '@id': data['@id']
  };
}

function associationFrame(data) {
  return {
    '@context': addToContext(data['@context'], {label, range, modified, isDefinedBy}),
    '@type': 'owl:ObjectProperty'
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
    dataType
  };

  return {
    '@context': addToContext(data['@context'], contextValues),
    '@type': 'sh:ShapeClass'
  };
}

module.exports = {
  modelFrame,
  modelListFrame,
  propertyFrame,
  classFrame,
  associationFrame,
  predicateFrame
};
