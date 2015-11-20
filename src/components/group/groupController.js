module.exports = function GroupController($scope, $q, $log, locationService, $location, groupId, groupService, modelService, userService, addModelModal, editableController) {
  'ngInject';

  const vm = this;

  editableController.mixin($scope, this, 'group', { edit: () => false });

  $q.all({
    group: groupService.getGroup(groupId),
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
