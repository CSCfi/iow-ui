const _ = require('lodash');
const jsonld = require('jsonld');
const frames = require('./frames');
const graphUtils = require('./graphUtils');

module.exports = function predicateService($http, $q) {
  'ngInject';

  return {
    getPredicate(id, userFrame = 'predicateFrame') {
      function frame(data) {
        return jsonld.promises.frame(data, frames[userFrame](data));
      }
      return $http.get('/api/rest/predicate', {params: {id}}).then(response => frame(response.data));
    },
    getAllPredicates() {
      return $http.get('/api/rest/predicate')
        .then(response => {
          const frame = frames.predicateSearchFrame(response.data);
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
    createPredicate(predicate, id) {
      const requestParams = {
        id,
        model: predicate.isDefinedBy || predicate['@graph'][0].isDefinedBy
      };
      return $http.put('/api/rest/predicate', predicate, {params: requestParams});
    },
    updatePredicate(predicate, id, originalId) {
      const requestParams = {
        id,
        model: predicate.isDefinedBy || predicate['@graph'][0].isDefinedBy
      };
      if (id !== originalId) {
        requestParams.oldid = originalId;
      }
      return $http.post('/api/rest/predicate', predicate, {params: requestParams});
    },
    deletePredicate(id, model) {
      const requestParams = {
        id,
        model: model
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
    getPredicateTemplate(context, modelID, predicateLabel, conceptID, type, lang) {
      return $http.get('/api/rest/predicateCreator', {params: {modelID, predicateLabel, conceptID, type, lang}})
        .then(response => {
          _.extend(response.data['@context'], context);
          const frame = frames.predicateFrame(response.data);
          return jsonld.promises.frame(response.data, frame);
        });
    }
  };
};
