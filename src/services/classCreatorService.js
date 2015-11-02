const jsonld = require('jsonld');
const frames = require('./frames');
const _ = require('lodash');

module.exports = function classCreatorService($http) {
  'ngInject';

  return {
    createClass(context, modelID, classLabel, conceptID) {
      return $http.get('/api/rest/classCreator', {params: {modelID, classLabel, conceptID}}).then(response => {
        _.extend(response.data['@context'], context);
        const frame = frames.classFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    }
  };
};
