module.exports = function searchService($http, entities) {
  'ngInject';

  return {
    search(graph, search, language) {
      return $http.get('/api/rest/search', {params: {graph, search, lang: language}})
        .then(response => entities.deserializeSearch(response.data));
    },
    searchAnything(search, language) {
      return $http.get('/api/rest/search', {
        params: {
          graph: 'default',
          search,
          lang: language
        }
      })
      .then(response => entities.deserializeSearch(response.data));
    }
  };
};
