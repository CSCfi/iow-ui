const jsonld = require('jsonld');

function languageTransform(response) {
  const frame = {
    '@context': angular.copy(response.data['@context'])
  };
  frame['@context'].label = {
    '@id': 'http://www.w3.org/2000/01/rdf-schema#label',
    '@container': '@language'
  };

  return jsonld.promises.frame(response.data, frame);
}

module.exports = function groupService($http) {
  'ngInject';
  return {
    getGroups() {
      return $http.get('/api/rest/groups').then(languageTransform);
    }
  };
};
