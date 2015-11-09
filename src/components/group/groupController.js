const _ = require('lodash');

module.exports = function GroupController($q, $log, $location, groupId, groupService, modelService, userService, addModelModal) {
  'ngInject';

  const vm = this;

  fetchAll().then(() => vm.loading = false);

  vm.canAddModel = () => {
    return userService.isLoggedIn();
  };

  vm.addModel = () => {
    addModelModal.open().result.then(result => {
      $location.path('/models');
      $location.search(_.extend(result, {group: groupId}));
    });
  };

  vm.canAskForRights = () => {
    return userService.isLoggedIn() && !userService.isInGroup(groupId);
  };

  function fetchGroup() {
    return groupService.getGroups()
      .then(groups => {
        vm.group = _.findWhere(groups, {id: groupId});
      }, error => $log.error(error));
  }

  function fetchModels() {
    return modelService.getModelsByGroup(groupId)
      .then(models => {
        vm.models = models;
      }, error => $log.error(error));
  }

  function fetchAll() {
    return $q.all([fetchGroup(), fetchModels()]);
  }
};
