const jsonld = require('jsonld');

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
    }
  };
};
