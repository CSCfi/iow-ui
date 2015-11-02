const jsonld = require('jsonld');
const frames = require('./frames');

module.exports = function classCreatorService($http) {
  'ngInject';

  return {
    createPredicate(modelID, predicateLabel, conceptID, type) {
      return $http.get('/api/rest/predicateCreator', {params: {modelID, predicateLabel, conceptID, type}}).then(response => {
        const frame = frames.predicateFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    }
  };
};
