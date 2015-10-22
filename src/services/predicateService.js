const jsonld = require('jsonld');

const frames = require('./frames');

module.exports = function predicateService($http, $q) {
  'ngInject';

  return {
    getPredicateById(id, userFrame = 'propertyFrame') {
      return $http.get('/api/rest/predicate', {params: {id}})
        .then(response => {
          console.log('predicate by id');
          console.log(JSON.stringify(response, null, 2));
          const frame = frames[userFrame](response.data);
          return jsonld.promises.frame(response.data, frame);
        });
    },
    getPredicatesForModel(model) {
      return $http.get('/api/rest/predicate', {params: {model}}).then(response => {
        const propertyFrame = frames.propertyFrame(response.data);
        const associationFrame = frames.associationFrame(response.data);
        console.log('predicates for model');
        console.log(JSON.stringify(response, null, 2));
        return $q.all({
          attributes: jsonld.promises.frame(response.data, propertyFrame),
          associations: jsonld.promises.frame(response.data, associationFrame)
        });
      });
    },
    updatePredicate(property, id, originalId) {
      const requestParams = {
        id,
        model: property.isDefinedBy
      };
      if (id !== originalId) {
        requestParams.oldid = originalId;
      }
      return $http.post('/api/rest/predicate', property, {params: requestParams});
    }
  };
};
