const _ = require('lodash');

const label = {
  '@id': 'http://www.w3.org/2000/01/rdf-schema#label',
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

function modelFrame(context) {
  return  {
    '@context': addToContext(context, {label, comment}),
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

function modelListFrame(context, type) {
  return {
    '@context': addToContext(context, {label}),
    '@type': type
  };
}

module.exports = {
  modelFrame,
  modelListFrame
};
