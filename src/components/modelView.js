const _ = require('lodash');
const jsonld = require('jsonld');

module.exports = function classView($log) {
  'ngInject';

  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./templates/modelView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
    },
    controller(userService) {
      'ngInject';

      const vm = this;
      vm.canEdit = userService.isLoggedIn;
    }
  };
};
