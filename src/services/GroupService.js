module.exports = /* @ngInject */ function GroupService($http) {
  return {
    getGroups() {
      return $http.get('/IOAPI/rest/groups');
    }
  };
};
