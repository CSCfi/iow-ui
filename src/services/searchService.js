const _ = require('lodash');
const jsonld = require('jsonld');
const frames = require('../services/frames');

module.exports = function searchService($http, $q, modelLanguage) {
  'ngInject';

  const propertyTypes = ['owl:ObjectProperty', 'owl:DatatypeProperty'];

  return {
    search(graph, search) {
      return $http.get('/api/rest/search', {params: {graph, search, lang: modelLanguage.getLanguage()}});
    },
    searchPredicates(search) {
      return $http.get('/api/rest/search', {
        params: {
          graph: 'default',
          search,
          lang: modelLanguage.getLanguage()
        }
      })
      .then(response => {
        const frame = frames.predicateSearchFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      })
      .then(framed => {
        return _.filter(framed['@graph'], graph => _.contains(propertyTypes, graph['@type']));
      });
    }
  };
};
