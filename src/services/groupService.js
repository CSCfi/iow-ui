const _ = require('lodash');

module.exports = function groupService($http, entities) {
  'ngInject';
  return {
    getAllGroups() {
      return $http.get('/api/rest/groups')
        .then(response => entities.deserializeGroupList(response.data));
    },
    getGroup(groupId) {
      // TODO proper API
      return $http.get('/api/rest/groups')
        .then(response => entities.deserializeGroupList(response.data))
        .then(groups => _.findWhere(groups, {id: groupId}));
    }
  };
};
