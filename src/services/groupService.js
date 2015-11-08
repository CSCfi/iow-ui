module.exports = function groupService($http, entities) {
  'ngInject';
  return {
    getGroups() {
      return $http.get('/api/rest/groups').then(response => entities.deserializeGroupList(response.data));
    }
  };
};
