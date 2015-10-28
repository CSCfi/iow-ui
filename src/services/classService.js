const jsonld = require('jsonld');
const frames = require('./frames');

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
      return $http.get('/api/rest/class', {params: {id}}).then(response => {
        const frame = frames.classFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    },
    getClassesForModel(model) {
      return $http.get('/api/rest/class', {params: {model}}).then(response => {
        const frame = frames.classFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
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
    assignClassToModel(classId, modelId) {
      const requestParams = {
        id: classId,
        model: modelId
      };
      return $http.post('/api/rest/class', undefined, {params: requestParams});
    }
  };
};
