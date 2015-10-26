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
    controller($uibModal, userService) {
      'ngInject';

      const vm = this;

      vm.addProperty = () => {
        $uibModal.open({
          template: require('./templates/addProperty.html'),
          size: 'large',
          controller: AddPropertyController,
          controllerAs: 'ctrl',
          bindToController: true
        });
      };

      vm.canAddProperty = () => userService.isLoggedIn() && vm.formController.visible();
    }
  };
};

function AddPropertyController($modalInstance) {
  'ngInject';

  const vm = this;
  vm.close = $modalInstance.dismiss;
  vm.isAttributeSelected = () => false;
}
