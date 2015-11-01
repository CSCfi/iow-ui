const jsonld = require('jsonld');
const frames = require('./frames');

module.exports = function classCreatorService($http) {
  'ngInject';

  return {
    createClass(modelID, classLabel, conceptID) {
      return $http.get('/api/rest/classCreator', {params: {modelID, classLabel, conceptID}}).then(response => {
        const frame = frames.classFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    }
  };
};
