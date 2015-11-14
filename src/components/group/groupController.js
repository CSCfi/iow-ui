const _ = require('lodash');

module.exports = function GroupController($q, $log, locationService, groupId, groupService, modelService, userService, addModelModal) {
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
    addModelModal.open().result.then(result => {
      locationService.toNewModelCreation(_.extend(result, {group: groupId}));
    });
  };

  vm.canAskForRights = () => {
    const user = userService.getUser();
    return user.isLoggedIn() && !user.isInGroup(groupId);
  };
};
