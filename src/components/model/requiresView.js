const _ = require('lodash');

module.exports = function requiresView() {
  'ngInject';

  return {
    scope: {
      requires: '='
    },
    restrict: 'E',
    template: require('./requiresView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['requiresView', '^modelView'],
    link($scope, element, attributes, controllers) {
      $scope.modelViewController = controllers[1];
      $scope.modelViewController.registerRequiresView(controllers[0]);
    },
    controller() {
      const vm = this;
      vm.opened = _.map(vm.requires, () => false);
      vm.open = require => vm.opened[vm.requires.indexOf(require)] = true;
    }
  };
};
