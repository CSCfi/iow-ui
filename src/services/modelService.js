const jsonld = require('jsonld');

const frames = require('./frames');

module.exports = /* $ngInject */ function modelService($http) {
  return {
    getModelsByGroup(groupUrn) {
      return $http.get('/IOAPI/rest/model', {
        params: {
          group: groupUrn
        }
      }).then(response => {
        const frame = frames.modelListFrame(response.data['@context'], response.data['@type']);
        return jsonld.promises.frame(response.data, frame);
      });
    },
    getModelByUrn(urn) {
      return $http.get('/IOAPI/rest/model', {
        params: {
          id: urn
        }
      }).then(response => {
        const frame = frames.modelFrame(response.data['@context']);
        return jsonld.promises.frame(response.data, frame);
      });
    }
  };
};
