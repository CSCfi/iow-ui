const _ = require('lodash');
const jsonld = require('jsonld');
const frames = require('./frames');

module.exports = function predicateCreatorService($http) {
  'ngInject';

  return {
    createPredicate(context, modelID, predicateLabel, conceptID, type, lang) {
      return $http.get('/api/rest/predicateCreator', {params: {modelID, predicateLabel, conceptID, type, lang}}).then(response => {
        _.extend(response.data['@context'], context);
        const frame = frames.predicateFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    }
  };
};
