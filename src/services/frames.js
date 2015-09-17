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

function addToContext(context, values) {
  return _.chain(context)
    .clone()
    .assign(values)
    .value();
}

function modelFrame(data) {
  return  {
    '@context': addToContext(data['@context'], {label, comment, title}),
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

module.exports = {
  modelFrame,
  modelListFrame
};
