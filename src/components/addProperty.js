module.exports = function addPropertyDirective() {
  return {
    scope: {},
    restrict: 'E',
    template: '<button type="button" class="btn btn-default" ng-click="ctrl.addProperty()" ng-if="ctrl.canAddProperty()" translate>Add property</button>',
    controllerAs: 'ctrl',
    require: '^editableForm',
    link($scope, element, attribute, editableFormController) {
      $scope.ctrl.formController = editableFormController;
    },
    controller: AddPropertyController
  };
};

function AddPropertyController($uibModal, userService) {
  'ngInject';

  const vm = this;

  vm.addProperty = addProperty;
  vm.canAddProperty = canAddProperty;

  function addProperty() {
    $uibModal.open({
      template: require('./templates/searchForm.html'),
      controller: ModalController,
      controllerAs: 'ctrl'
    });
  }

  function canAddProperty() {
    return userService.isLoggedIn() && vm.formController.visible();
  }
}


function ModalController($modalInstance) {
  'ngInject';
}
