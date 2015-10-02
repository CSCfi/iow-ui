const _ = require('lodash');

const label = {
  '@id': 'http://www.w3.org/2000/01/rdf-schema#label',
  '@container': '@language'
};

const title = {
  '@id': 'http://purl.org/dc/terms/title',
  '@container': '@language'
};

const comment = {
  '@id': 'http://www.w3.org/2000/01/rdf-schema#comment',
  '@container': '@language'
};

const example = {
  '@id': 'http://www.w3.org/2004/02/skos/core#example',
  '@container': '@language'
};

const prefLabel = {
  '@id': 'http://www.w3.org/2004/02/skos/core#prefLabel',
  '@container': '@language'
};

function addToContext(context, values) {
  return _.chain(context)
    .clone()
    .assign(values)
    .value();
}

function modelFrame(data) {
  return  {
    '@context': addToContext(data['@context'], {label, comment, title, example, prefLabel}),
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
    '@context': addToContext(data['@context'], {label}),
    '@type': 'sd:NamedGraph'
  };
}

function propertyFrame(data) {
  return {
    '@context': addToContext(data['@context'], {label}),
    '@type': 'owl:DatatypeProperty'
  };
}

function associationFrame(data) {
  return {
    '@context': addToContext(data['@context'], {label}),
    '@type': 'owl:ObjectProperty'
  };
}

function classFrame(data) {
  return {
    '@context': addToContext(data['@context'], {comment, label}),
    '@type': 'sh:ShapeClass'
  };
}

module.exports = {
  modelFrame,
  modelListFrame,
  propertyFrame,
  classFrame,
  associationFrame
};
