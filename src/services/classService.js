const jsonld = require('jsonld');

const frames = require('./frames');

module.exports = function classService($http) {
  'ngInject';
  return {
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
      if (requestParams.id !== originalId) {
        requestParams.oldid = originalId;
      }
      return $http.post('/api/rest/class', classData, {params: requestParams});
    }
  };
};
