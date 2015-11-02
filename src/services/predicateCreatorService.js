const jsonld = require('jsonld');
const frames = require('./frames');

module.exports = function classCreatorService($http) {
  'ngInject';

  return {
    createPredicate(context, modelID, predicateLabel, conceptID, type) {
      return $http.get('/api/rest/predicateCreator', {params: {modelID, predicateLabel, conceptID, type}}).then(response => {
        _.extend(response.data['@context'], context);
        const frame = frames.predicateFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    }
  };
};
