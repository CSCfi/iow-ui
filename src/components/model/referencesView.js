module.exports = function referencesView() {
  'ngInject';

  return {
    scope: {
      references: '='
    },
    restrict: 'E',
    template: require('./referencesView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['referencesView', '^modelView'],
    link($scope, element, attributes, controllers) {
      $scope.modelViewController = controllers[1];
      $scope.modelViewController.registerReferencesView(controllers[0]);
    },
    controller() {
      const vm = this;
      vm.opened = {};
      vm.open = reference => vm.opened[reference.id] = true;
    }
  };
};
