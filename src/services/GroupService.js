module.exports = /* @ngInject */ function groupService($http) {
  return {
    getGroups() {
      return $http.get('/IOAPI/rest/groups');
    }
  };
};
