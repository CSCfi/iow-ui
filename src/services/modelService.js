const jsonld = require('jsonld');
const frames = require('./frames');
const graphUtils = require('./graphUtils');
const utils = require('./utils');

module.exports = function modelService($http) {
  'ngInject';
  return {
    getModelsByGroup(groupUrn) {
      return $http.get('/api/rest/model', {
        params: {
          group: groupUrn
        }
      }).then(response => {
        const frame = frames.modelListFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    },
    getModelByUrn(urn) {
      return $http.get('/api/rest/model', {
        params: {
          id: urn
        }
      })
      .then(response => {
        const frame = frames.modelFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      })
      .then(framedModel => {
        utils.ensurePropertyAsArray(graphUtils.graph(framedModel), 'references');
        utils.ensurePropertyAsArray(graphUtils.graph(framedModel), 'requires');
        return framedModel;
      });
    },
    updateModel(model) {
      return $http.post('/api/rest/model', model, {
        params: {
          id: graphUtils.withFullId(model)
        }
      });
    }
  };
};
