import { Uri } from './entities';

type Frame = {};

const coreContext = {
  and: { '@id': 'http://www.w3.org/ns/shacl#and', '@container': '@set' },
  comment: { '@id': 'http://www.w3.org/2000/01/rdf-schema#comment', '@container': '@language' },
  constraint: { '@id': 'http://www.w3.org/ns/shacl#constraint', '@type': '@id' },
  created: { '@id': 'http://purl.org/dc/terms/created', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' },
  datatype: { '@id': 'http://www.w3.org/ns/shacl#datatype', '@type': '@id' },
  equivalentClass: { '@id' : 'http://www.w3.org/2002/07/owl#equivalentClass', '@type' : '@id' },
  equivalentProperty: { '@id' : 'http://www.w3.org/2002/07/owl#equivalentProperty', '@type' : '@id' },
  example: { '@id': 'http://www.w3.org/2004/02/skos/core#example', '@container': '@language' },
  foaf: 'http://xmlns.com/foaf/0.1/',
  hasPart: { '@id': 'http://purl.org/dc/terms/hasPart', '@type': '@id' },
  homepage: { '@id': 'http://xmlns.com/foaf/0.1/homepage' },
  identifier: { '@id': 'http://purl.org/dc/terms/identifier', '@type': 'http://www.w3.org/2001/XMLSchema#string' },
  imports: { '@id': 'http://www.w3.org/2002/07/owl#imports', '@type': '@id' },
  index: { '@id': 'http://www.w3.org/ns/shacl#index' },
  inScheme: { '@id': 'http://www.w3.org/2004/02/skos/core#inScheme' },
  isAdminOf: { '@id': 'http://purl.org/dc/terms/isAdminOf', '@type': '@id' },
  isDefinedBy: { '@id': 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', '@type': '@id' },
  isPartOf: { '@id': 'http://purl.org/dc/terms/isPartOf', '@type': '@id' },
  isReferencedBy: { '@id': 'http://purl.org/dc/terms/isReferencedBy', '@type': '@id' },
  label: { '@id': 'http://www.w3.org/2000/01/rdf-schema#label', '@container': '@language' },
  modified: { '@id': 'http://purl.org/dc/terms/modified', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' },
  nodeKind: { '@id': 'http://www.w3.org/ns/shacl#nodeKind', '@type': '@id' },
  or: { '@id': 'http://www.w3.org/ns/shacl#or', '@container': '@set' },
  pattern: { '@id': 'http://www.w3.org/ns/shacl#pattern' },
  predicate: { '@id': 'http://www.w3.org/ns/shacl#predicate', '@type': '@id' },
  preferredXMLNamespaceName: { '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespaceName', '@type': 'http://www.w3.org/2001/XMLSchema#string' },
  preferredXMLNamespacePrefix: { '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespacePrefix', '@type': 'http://www.w3.org/2001/XMLSchema#string' },
  prefLabel: { '@id': 'http://www.w3.org/2004/02/skos/core#prefLabel', '@container': '@language' },
  property: { '@id': 'http://www.w3.org/ns/shacl#property', '@type': '@id' },
  range: { '@id': 'http://www.w3.org/2000/01/rdf-schema#range', '@type': '@id' },
  references: { '@id': 'http://purl.org/dc/terms/references', '@type': '@id' },
  requires: { '@id': 'http://purl.org/dc/terms/requires', '@type': '@id' },
  subClassOf: { '@id': 'http://www.w3.org/2000/01/rdf-schema#subClassOf', '@type': '@id' },
  subject: { '@id': 'http://purl.org/dc/terms/subject', '@type': '@id' },
  subPropertyOf: { '@id': 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf', '@type': '@id' },
  title: { '@id': 'http://purl.org/dc/terms/title', '@container': '@language' },
  valueShape: { '@id': 'http://www.w3.org/ns/shacl#valueShape', '@type': '@id' },
  versionInfo: { '@id': 'http://www.w3.org/2002/07/owl#versionInfo' }
};

const propertyContext = {
  maxCount: { '@id': 'http://www.w3.org/ns/shacl#maxCount'},
  minCount: { '@id': 'http://www.w3.org/ns/shacl#minCount'}
};

const classContext = Object.assign({}, propertyContext, {
  abstract: { '@id': 'http://www.w3.org/ns/shacl#abstract'}
});

function frame(data: any, context: {}, frame?: {}) {
  return Object.assign({ '@context': Object.assign({}, data['@context'], coreContext, context) }, frame);
}

export function groupFrame(data: any): Frame {
  return frame(data, {});
}

export function groupListFrame(data: any): Frame {
  return frame(data, {});
}

export function modelFrame(data: any): Frame {
  return frame(data, {}, { isPartOf: {} });
}

export function usageFrame(data: any): Frame {
  return frame(data, {}, { isReferencedBy: {} });
}

export function modelListFrame(data: any): Frame {
  return frame(data, {}, { isPartOf: {} });
}

export function propertyFrame(data: any): Frame {
  return frame(data, propertyContext, { '@id': data['@id'] });
}

export function predicateListFrame(data: any): Frame {
  return frame(data, {}, { isDefinedBy: {} });
}

export function predicateFrame(data: any): Frame {
  return frame(data, {}, { isDefinedBy: {} });
}

export function classFrame(data: any): Frame {
  return frame(data, classContext, { isDefinedBy: {} });
}

export function classListFrame(data: any): Frame {
  return frame(data, {}, { isDefinedBy: {} });
}

export function conceptSuggestionFrame(data: any): Frame {
  return frame(data, {}, { inScheme: {} });
}

export function fintoConceptFrame(data: any, id: Uri): Frame {
  /* Finto API fix */
  const context: any = {
    value: null,
    lang: null
  };

  return frame(data, context, { '@id': id });
}

export function userFrame(data: any): Frame {
  const context = {
    name: { '@id': 'http://xmlns.com/foaf/0.1/name'}
  };
  return frame(data, context, { name: {} });
}

export function requireFrame(data: any): Frame {
  return frame(data, {});
}

export function searchResultFrame(data: any): Frame {
  return frame(data, {});
}

export function classVisualizationFrame(data: any): Frame {
  return frame(data, classContext, {
    property: {
      predicate: {
        '@embed': false
      },
      valueShape: {
        '@omitDefault': true,
        '@default': [],
        '@embed': false
      }
    }
  });
}
