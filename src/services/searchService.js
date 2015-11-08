const _ = require('lodash');
const frames = require('../services/frames');

module.exports = function searchService($http, $q, modelLanguage) {
  'ngInject';

  return {
    search(graph, search) {
      return $http.get('/api/rest/search', {params: {graph, search, lang: modelLanguage.getLanguage()}});
    }
  };
};
