const _ = require('lodash');

module.exports = function predicateService($http, $q, entities) {
  'ngInject';

  return {
    getPredicate(id) {
      return $http.get('/api/rest/predicate', {params: {id}}).then(response => entities.deserializePredicate(response.data));
    },
    getAllPredicates() {
      return $http.get('/api/rest/predicate').then(response => entities.deserializePredicateList(response.data));
    },
    getPredicatesForModel(model) {
      return $http.get('/api/rest/predicate', {params: {model}}).then(response => entities.deserializePredicateList(response.data));
    },
    createPredicate(predicate) {
      const requestParams = {
        id: predicate.id,
        model: predicate.modelId
      };
      return $http.put('/api/rest/predicate', predicate.serialize(), {params: requestParams});
    },
    updatePredicate(predicate, originalId) {
      const requestParams = {
        id: predicate.id,
        model: predicate.modelId
      };
      if (requestParams.id !== originalId) {
        requestParams.oldid = originalId;
      }
      return $http.post('/api/rest/predicate', predicate.serialize(), {params: requestParams});
    },
    deletePredicate(id, modelId) {
      const requestParams = {
        id,
        model: modelId
      };
      return $http.delete('/api/rest/predicate', {params: requestParams});
    },
    assignPredicateToModel(predicateId, modelId) {
      const requestParams = {
        id: predicateId,
        model: modelId
      };
      return $http.post('/api/rest/predicate', undefined, {params: requestParams});
    },
    newPredicate(context, modelID, predicateLabel, conceptID, type, lang) {
      return $http.get('/api/rest/predicateCreator', {params: {modelID, predicateLabel, conceptID, type, lang}})
        .then(response => {
          _.extend(response.data['@context'], context);
          return response;
        })
        .then(response => entities.deserializePredicate(response.data));
    }
  };
};
