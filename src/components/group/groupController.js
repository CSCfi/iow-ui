const _ = require('lodash');

module.exports = function GroupController($q, $log, locationService, $location, groupId, groupService, modelService, userService, addModelModal) {
  'ngInject';

  const vm = this;

  $q.all({
    group: groupService.getGroups().then(groups => _.findWhere(groups, {id: groupId})),
    models: modelService.getModelsByGroup(groupId)
  })
  .then(({group, models}) => {
    vm.group = group;
    vm.models = models;
    locationService.atGroup(group);
    vm.loading = false;
  });

  vm.canAddModel = () => {
    return userService.isLoggedIn();
  };

  vm.addModel = () => {
    addModelModal.open().result.then(({prefix, label}) => {
      $location.path('/models');
      $location.search({prefix, label, group: groupId});
    });
  };

  vm.canAskForRights = () => {
    const user = userService.getUser();
    return user.isLoggedIn() && !user.isInGroup(groupId);
  };
};
