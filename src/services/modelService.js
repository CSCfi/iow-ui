const jsonld = require('jsonld');

const modelFrame = context => {
  const newContext = angular.copy(context);
  newContext.label = {
    '@id': 'http://www.w3.org/2000/01/rdf-schema#label',
    '@container': '@language'
  };
  newContext.comment = {
    '@id': 'http://www.w3.org/2000/01/rdf-schema#comment',
    '@container': '@language'
  };
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
};

function transformToList(response) {
  const frame = {
    '@context': response.data['@context'],
    '@type': response.data['@type']
  };
  frame['@context'].label = {
    '@id': 'http://www.w3.org/2000/01/rdf-schema#label',
    '@container': '@language'
  };
  return jsonld.promises.frame(response.data, frame);
}

module.exports = /* $ngInject */ function modelService($http) {
  return {
    getModelsByGroup(groupUrn) {
      return $http.get('/IOAPI/rest/model', {
        params: {
          group: groupUrn
        }
      }).then(transformToList);
    },
    getModelByUrn(urn) {
      return $http.get('/IOAPI/rest/model', {
        params: {
          id: urn
        }
      }).then(response => {
        const frame = modelFrame(response.data['@context']);
        console.log(frame);
        return jsonld.promises.frame(response.data, frame);
      });
    }
  };
};
