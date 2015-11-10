module.exports = function searchService($http) {
  'ngInject';

  return {
    search(graph, search, language) {
      return $http.get('/api/rest/search', {params: {graph, search, lang: language}});
    }
  };
};
