import { Url } from './entities';

export type Frame = {};
export type FrameFn = (data: any) => Frame;

const coreContext = {
  and: { '@id': 'http://www.w3.org/ns/shacl#and', '@container': '@list' },
  comment: { '@id': 'http://www.w3.org/2000/01/rdf-schema#comment', '@container': '@language' },
  constraint: { '@id': 'http://www.w3.org/ns/shacl#constraint', '@type': '@id' },
  created: { '@id': 'http://purl.org/dc/terms/created', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' },
  datatype: { '@id': 'http://www.w3.org/ns/shacl#datatype', '@type': '@id' },
  definition: {'@id': 'http://www.w3.org/2004/02/skos/core#definition', '@container': '@language' },
  equivalentClass: { '@id' : 'http://www.w3.org/2002/07/owl#equivalentClass', '@type' : '@id' },
  equivalentProperty: { '@id' : 'http://www.w3.org/2002/07/owl#equivalentProperty', '@type' : '@id' },
  example: { '@id': 'http://www.w3.org/2004/02/skos/core#example' },
  foaf: 'http://xmlns.com/foaf/0.1/',
  hasPart: { '@id': 'http://purl.org/dc/terms/hasPart', '@type': '@id' },
  homepage: { '@id': 'http://xmlns.com/foaf/0.1/homepage' },
  identifier: { '@id': 'http://purl.org/dc/terms/identifier' },
  imports: { '@id': 'http://www.w3.org/2002/07/owl#imports', '@type': '@id' },
  index: { '@id': 'http://www.w3.org/ns/shacl#index' },
  inScheme: { '@id': 'http://www.w3.org/2004/02/skos/core#inScheme', '@type': '@id' },
  isAdminOf: { '@id': 'http://purl.org/dc/terms/isAdminOf', '@type': '@id' },
  isDefinedBy: { '@id': 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', '@type': '@id' },
  isPartOf: { '@id': 'http://purl.org/dc/terms/isPartOf', '@type': '@id' },
  isReferencedBy: { '@id': 'http://purl.org/dc/terms/isReferencedBy', '@type': '@id' },
  label: { '@id': 'http://www.w3.org/2000/01/rdf-schema#label', '@container': '@language' },
  modified: { '@id': 'http://purl.org/dc/terms/modified', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' },
  nodeKind: { '@id': 'http://www.w3.org/ns/shacl#nodeKind', '@type': '@id' },
  or: { '@id': 'http://www.w3.org/ns/shacl#or', '@container': '@list' },
  pattern: { '@id': 'http://www.w3.org/ns/shacl#pattern' },
  predicate: { '@id': 'http://www.w3.org/ns/shacl#predicate', '@type': '@id' },
  preferredXMLNamespaceName: { '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespaceName' },
  preferredXMLNamespacePrefix: { '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespacePrefix' },
  prefLabel: { '@id': 'http://www.w3.org/2004/02/skos/core#prefLabel', '@container': '@language' },
  prov: "http://www.w3.org/ns/prov#",
  range: { '@id': 'http://www.w3.org/2000/01/rdf-schema#range', '@type': '@id' },
  references: { '@id': 'http://purl.org/dc/terms/references', '@type': '@id' },
  requires: { '@id': 'http://purl.org/dc/terms/requires', '@type': '@id' },
  subject: { '@id': 'http://purl.org/dc/terms/subject', '@type': '@id' },
  subPropertyOf: { '@id': 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf', '@type': '@id' },
  title: { '@id': 'http://purl.org/dc/terms/title', '@container': '@language' },
  valueShape: { '@id': 'http://www.w3.org/ns/shacl#valueShape', '@type': '@id' },
  versionInfo: { '@id': 'http://www.w3.org/2002/07/owl#versionInfo' }
};

const propertyContext = Object.assign({}, coreContext, {
  maxCount: { '@id': 'http://www.w3.org/ns/shacl#maxCount'},
  minCount: { '@id': 'http://www.w3.org/ns/shacl#minCount'}
});

const classContext = Object.assign({}, coreContext, propertyContext, {
  abstract: { '@id': 'http://www.w3.org/ns/shacl#abstract'},
  property: { '@id': 'http://www.w3.org/ns/shacl#property', '@type': '@id' },
  scopeClass : { '@id' : 'http://www.w3.org/ns/shacl#scopeClass', '@type' : '@id' },
  subClassOf: { '@id': 'http://www.w3.org/2000/01/rdf-schema#subClassOf', '@type': '@id' }
});

const versionContext = Object.assign({}, coreContext, {
  wasAttributedTo: { '@id': 'http://www.w3.org/ns/prov#wasAttributedTo', '@type': '@id' },
  wasRevisionOf : { '@id' : 'http://www.w3.org/ns/prov#wasRevisionOf',  '@type' : '@id' },
  generatedAtTime: { '@id': 'http://www.w3.org/ns/prov#generatedAtTime', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' },
  startedAtTime: { '@id': 'http://www.w3.org/ns/prov#startedAtTime', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' },
  generated: { '@id': 'http://www.w3.org/ns/prov#generated', '@type': '@id' },
  used: { '@id': 'http://www.w3.org/ns/prov#used', '@type': '@id' }
});

const groupContext = Object.assign({}, coreContext, {});

const modelContext = Object.assign({}, coreContext, {
  rootResource : { '@id' : 'http://rdfs.org/ns/void#rootResource',  '@type' : '@id' }
});

const usageContext = Object.assign({}, coreContext, {});
const predicateContext = Object.assign({}, coreContext, {});
const conceptContext = Object.assign({}, coreContext, {});

const userContext = Object.assign({}, coreContext, {
  name: { '@id': 'http://xmlns.com/foaf/0.1/name'}
});

const requireContext = Object.assign({}, coreContext, {});
const searchResultContext = Object.assign({}, coreContext, {});

function frame(data: any, context: {}, frame?: {}) {
  return Object.assign({ '@context': Object.assign({}, data['@context'], context) }, frame);
}

export function groupFrame(data: any): Frame {
  return frame(data, groupContext);
}

export function groupListFrame(data: any): Frame {
  return frame(data, groupContext);
}

export function modelFrame(data: any): Frame {
  return frame(data, modelContext, { isPartOf: {} });
}

export function modelListFrame(data: any): Frame {
  return frame(data, modelContext, { isPartOf: {} });
}

export function usageFrame(data: any): Frame {
  return frame(data, usageContext, { isReferencedBy: {} });
}

export function propertyFrame(data: any): Frame {
  return frame(data, propertyContext, { '@id': data['@id'] });
}

export function predicateListFrame(data: any): Frame {
  return frame(data, predicateContext, { isDefinedBy: {} });
}

export function predicateFrame(data: any): Frame {
  return frame(data, predicateContext, { isDefinedBy: {} });
}

export function classFrame(data: any): Frame {
  return frame(data, classContext, { '@type': ['rdfs:Class'] });
}

export function classListFrame(data: any): Frame {
  return frame(data, classContext, { isDefinedBy: {} });
}

export function iowConceptFrame(data: any): Frame {
  return frame(data, conceptContext, { inScheme: {} });
}

export function fintoConceptFrame(data: any, id: Url): Frame {

  const context = Object.assign({}, coreContext, {
    value: null,
    lang: null,
    uri: null,
    type: null,
    graph: null,
    comment: { '@id': 'http://www.w3.org/2000/01/rdf-schema#comment', '@container': '@language' }
  });

  return frame(data, context, { '@id': id });
}

export function fintoConceptSearchResultsFrame(data: any): Frame {

  const context = Object.assign({}, coreContext, {
    value: null,
    lang: null,
    uri: null,
    type: null,
    graph: null
  });

  return frame(data, context, { '@type': 'skos:Concept' });
}

export function userFrame(data: any): Frame {
  return frame(data, userContext, { name: {} });
}

export function requireFrame(data: any): Frame {
  return frame(data, requireContext);
}

export function searchResultFrame(data: any): Frame {
  return frame(data, searchResultContext);
}

export function classVisualizationFrame(data: any): Frame {
  return frame(data, classContext, {
    '@type': ['rdfs:Class', 'sh:Shape'],
    property: {
      predicate: {
        '@embed': false
      },
      valueShape: {
        '@omitDefault': true,
        '@default': [],
        '@embed': false
      }
    },
    subject: {
      '@embed': false
    },
    subClassOf: {
      '@embed': false
    },
    isDefinedBy: {
      '@embed': false
    }
  });
}

export function versionFrame(data: any): Frame {
  return frame(data, versionContext, {
    'generated': {
      'wasAttributedTo': {},
      'wasRevisionOf': {
        '@omitDefault': true,
        '@default': [],
        '@embed': false
      }
    },
    'used': {
      '@embed': '@never'
    }
  });
}
