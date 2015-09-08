const _ = require('lodash');

const label = {
  '@id': 'http://www.w3.org/2000/01/rdf-schema#label',
  '@container': '@language'
};

const comment = {
  '@id': 'http://www.w3.org/2000/01/rdf-schema#comment',
  '@container': '@language'
};

function modelFrame(context) {
  const newContext = _.chain(context).clone().assign({label, comment}).value();
  return  {
    '@context': newContext,
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

module.exports = {
  modelFrame
};
