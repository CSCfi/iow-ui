const jsonld = require('jsonld');

module.exports = function propertyService($http) {
  'ngInject';
  return {
    getProperty(predicate, context) {
      const data = {
        predicate: predicate,
        '@context': context
      };
      return jsonld.promises.expand(data).then(expanded => {
        const id = expanded[0]['http://www.w3.org/ns/shacl#predicate'][0]['@id'];
        return $http.get('/api/rest/property', {params: {id}});
      });
    }
  };
};
