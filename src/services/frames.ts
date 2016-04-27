import { Url } from './uri';

export type Frame = {};
export type FrameFn = (data: any) => Frame;

const inScheme = { '@id': 'http://www.w3.org/2004/02/skos/core#inScheme', '@type': '@id' };
const subject = { '@id': 'http://purl.org/dc/terms/subject', '@type': '@id' };

const coreContext = {
  comment: { '@id': 'http://www.w3.org/2000/01/rdf-schema#comment', '@container': '@language' },
  created: { '@id': 'http://purl.org/dc/terms/created', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' },
  definition: {'@id': 'http://www.w3.org/2004/02/skos/core#definition', '@container': '@language' },
  foaf: 'http://xmlns.com/foaf/0.1/',
  hasPart: { '@id': 'http://purl.org/dc/terms/hasPart', '@type': '@id' },
  homepage: { '@id': 'http://xmlns.com/foaf/0.1/homepage' },
  identifier: { '@id': 'http://purl.org/dc/terms/identifier' },
  imports: { '@id': 'http://www.w3.org/2002/07/owl#imports', '@type': '@id' },
  isDefinedBy: { '@id': 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', '@type': '@id' },
  isPartOf: { '@id': 'http://purl.org/dc/terms/isPartOf', '@type': '@id' },
  label: { '@id': 'http://www.w3.org/2000/01/rdf-schema#label', '@container': '@language' },
  modified: { '@id': 'http://purl.org/dc/terms/modified', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' },
  nodeKind: { '@id': 'http://www.w3.org/ns/shacl#nodeKind', '@type': '@id' },
  prefLabel: { '@id': 'http://www.w3.org/2004/02/skos/core#prefLabel', '@container': '@language' },
  prov: "http://www.w3.org/ns/prov#",
  title: { '@id': 'http://purl.org/dc/terms/title', '@container': '@language' },
  versionInfo: { '@id': 'http://www.w3.org/2002/07/owl#versionInfo' }
};

const predicateContext = Object.assign({}, coreContext, {
  range: { '@id': 'http://www.w3.org/2000/01/rdf-schema#range', '@type': '@id' },
  subPropertyOf: { '@id': 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf', '@type': '@id' },
  equivalentProperty: { '@id' : 'http://www.w3.org/2002/07/owl#equivalentProperty', '@type' : '@id' },
  datatype: { '@id': 'http://www.w3.org/ns/shacl#datatype', '@type': '@id' },
  subject
});

const propertyContext = Object.assign({}, coreContext, predicateContext, {
  index: { '@id': 'http://www.w3.org/ns/shacl#index' },
  example: { '@id': 'http://www.w3.org/2004/02/skos/core#example' },
  defaultValue: { '@id': 'http://www.w3.org/ns/shacl#defaultValue' },
  maxCount: { '@id': 'http://www.w3.org/ns/shacl#maxCount' },
  minCount: { '@id': 'http://www.w3.org/ns/shacl#minCount' },
  maxLength: { '@id': 'http://www.w3.org/ns/shacl#maxLength' },
  minLength: { '@id': 'http://www.w3.org/ns/shacl#minLength' },
  in: { '@id': 'http://www.w3.org/ns/shacl#in', '@container': '@list' },
  hasValue: { '@id': 'http://www.w3.org/ns/shacl#hasValue' },
  pattern: { '@id': 'http://www.w3.org/ns/shacl#pattern' },
  type: { '@id': 'http://purl.org/dc/terms/type', '@type': '@id' },
  valueShape: { '@id': 'http://www.w3.org/ns/shacl#valueShape', '@type': '@id' },
  predicate: { '@id': 'http://www.w3.org/ns/shacl#predicate', '@type': '@id' },
  classIn: { '@id': 'http://www.w3.org/ns/shacl#classIn', '@type': '@id' }
});

const classContext = Object.assign({}, coreContext, propertyContext, {
  abstract: { '@id': 'http://www.w3.org/ns/shacl#abstract'},
  property: { '@id': 'http://www.w3.org/ns/shacl#property', '@type': '@id' },
  scopeClass : { '@id' : 'http://www.w3.org/ns/shacl#scopeClass', '@type' : '@id' },
  subClassOf: { '@id': 'http://www.w3.org/2000/01/rdf-schema#subClassOf', '@type': '@id' },
  equivalentClass: { '@id' : 'http://www.w3.org/2002/07/owl#equivalentClass', '@type' : '@id' },
  constraint: { '@id': 'http://www.w3.org/ns/shacl#constraint', '@type': '@id' },
  or: { '@id': 'http://www.w3.org/ns/shacl#or', '@container': '@list' },
  and: { '@id': 'http://www.w3.org/ns/shacl#and', '@container': '@list' },
  subject
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

const requireContext = Object.assign({}, coreContext, {
  preferredXMLNamespaceName: { '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespaceName' },
  preferredXMLNamespacePrefix: { '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespacePrefix' }
});

const modelContext = Object.assign({}, coreContext, requireContext, {
  rootResource : { '@id' : 'http://rdfs.org/ns/void#rootResource',  '@type' : '@id' },
  references: { '@id': 'http://purl.org/dc/terms/references', '@type': '@id' },
  requires: { '@id': 'http://purl.org/dc/terms/requires', '@type': '@id' },
  relations: { '@id': 'http://purl.org/dc/terms/relation', '@container': '@list' },
  description: { '@id': 'http://purl.org/dc/terms/description', '@container': '@language' },
  language: { '@id': 'http://purl.org/dc/terms/language', '@container': '@list' }
});

const usageContext = Object.assign({}, coreContext, {
  isReferencedBy: { '@id': 'http://purl.org/dc/terms/isReferencedBy', '@type': '@id' }
});

const conceptContext = Object.assign({}, coreContext, {
  inScheme
});

const userContext = Object.assign({}, coreContext, {
  name: { '@id': 'http://xmlns.com/foaf/0.1/name'},
  isAdminOf: { '@id': 'http://purl.org/dc/terms/isAdminOf', '@type': '@id' }
});

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
  return frame(data, predicateContext, {
    isDefinedBy: { '@embed': '@always' }
  });
}

export function classFrame(data: any): Frame {
  return frame(data, classContext, {
    '@type': ['rdfs:Class', 'sh:Shape'],
    isDefinedBy: { '@embed': '@always' },
    subject: { '@embed': '@always' }
  });
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
    comment: { '@id': 'http://www.w3.org/2000/01/rdf-schema#comment', '@container': '@language' },
    inScheme
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
      },
      classIn: {
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
    generated: {
      wasAttributedTo: {},
      wasRevisionOf: {
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
