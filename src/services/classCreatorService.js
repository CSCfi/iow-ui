const _ = require('lodash');
const jsonld = require('jsonld');
const frames = require('./frames');
const graphUtils = require('./graphUtils');
const utils = require('./utils');

module.exports = function classCreatorService($http) {
  'ngInject';

  return {
    createClass(context, modelID, classLabel, conceptID, lang) {
      return $http.get('/api/rest/classCreator', {params: {modelID, classLabel, conceptID, lang}})
        .then(response => {
          _.extend(response.data['@context'], context);
          const frame = frames.classFrame(response.data);
          return jsonld.promises.frame(response.data, frame);
        })
        .then(framedClass => {
          utils.ensurePropertyAsArray(graphUtils.graph(framedClass), 'property');
          return framedClass;
        });
    }
  };
};
