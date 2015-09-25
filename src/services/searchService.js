module.exports = function searchService($http) {
  'ngInject';
  return {
    search(graph, query) {
      return $http.get('/api/rest/search', {params: {graph, query}});
    }
  };
};
