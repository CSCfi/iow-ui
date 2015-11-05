const _ = require('lodash');
const jsonld = require('jsonld');
const frames = require('./frames');
const graphUtils = require('./graphUtils');
const utils = require('./utils');

module.exports = function classService($http) {
  'ngInject';
  return {
    getAllClasses() {
      return $http.get('/api/rest/class').then(response => {
        const frame = frames.classSearchFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    },
    getClass(id) {
      function frame(data) {
        return jsonld.promises.frame(data, frames.classFrame(data))
        .then(framedClass => {
          utils.ensurePropertyAsArray(graphUtils.graph(framedClass), 'property');
          return framedClass;
        });
      }
      return $http.get('/api/rest/class', {params: {id}}).then(response => frame(response.data));
    },
    getClassesForModel(model) {
      return $http.get('/api/rest/class', {params: {model}}).then(response => {
        const frame = frames.classFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    },
    createClass(classData, id) {
      const requestParams = {
        id,
        model: classData['@graph'][0].isDefinedBy
      };
      return $http.put('/api/rest/class', classData, {params: requestParams});
    },
    updateClass(classData, id, originalId) {
      const requestParams = {
        id,
        model: classData['@graph'][0].isDefinedBy
      };
      if (id !== originalId) {
        requestParams.oldid = originalId;
      }
      return $http.post('/api/rest/class', classData, {params: requestParams});
    },
    deleteClass(id, model) {
      const requestParams = {
        id,
        model: model
      };
      return $http.delete('/api/rest/class', {params: requestParams});
    },
    assignClassToModel(classId, modelId) {
      const requestParams = {
        id: classId,
        model: modelId
      };
      return $http.post('/api/rest/class', undefined, {params: requestParams});
    }
  };
};
