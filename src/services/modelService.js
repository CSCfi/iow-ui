module.exports = /* $ngInject */ function modelService($http) {
  return {
    getModelsByGroup(groupUrn) {
      return $http.get('/IOAPI/rest/core', {
        params: {
          group: groupUrn
        }
      });
    }
  };
};
