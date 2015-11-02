const jsonld = require('jsonld');
const frames = require('./frames');

module.exports = function predicateService($http, $q) {
  'ngInject';

  return {
    getAllPredicates() {
      return $http.get('/api/rest/predicate')
        .then(response => {
          const frame = frames.predicateSearchFrame(response.data);
          return jsonld.promises.frame(response.data, frame);
        });
    },
    getPredicateById(id, userFrame = 'propertyFrame') {
      return $http.get('/api/rest/predicate', {params: {id}})
        .then(response => {
          const frame = frames[userFrame](response.data);
          return jsonld.promises.frame(response.data, frame);
        });
    },
    getPredicatesForModel(model) {
      return $http.get('/api/rest/predicate', {params: {model}}).then(response => {
        const attributeFrame = frames.attributeFrame(response.data);
        const associationFrame = frames.associationFrame(response.data);
        return $q.all({
          attributes: jsonld.promises.frame(response.data, attributeFrame),
          associations: jsonld.promises.frame(response.data, associationFrame)
        });
      });
    },
    updatePredicate(predicate, id, originalId) {
      const requestParams = {
        id,
        model: predicate.isDefinedBy
      };
      if (id !== originalId) {
        requestParams.oldid = originalId;
      }
      return $http.post('/api/rest/predicate', predicate, {params: requestParams});
    },
    createPredicate(predicate, id) {
      const requestParams = {
        id,
        model: predicate.isDefinedBy
      };
      return $http.put('/api/rest/predicate', predicate, {params: requestParams});
    }
  };
};
