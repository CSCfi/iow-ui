module.exports = function classView() {
  'ngInject';
  return {
    scope: {
      class: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./classView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['classView', '^ngController'],
    link($scope, element, attributes, controllers) {
      $scope.modelController = controllers[1];
      $scope.modelController.registerView(controllers[0]);
    },
    controller($scope, classService, searchPredicateModal, editableController, userService) {
      'ngInject';

      let classForm;
      const vm = this;

      $scope.$watch(() => vm.class, () => {
        classService.getVisualizationData(vm.class.id, vm.model.id)
          .then(data => {
            data.root = vm.class.curie;
            vm.visualizationData = data
          });
      });

      const rights = {
        edit: () => userService.isLoggedIn() && vm.class.modelId === vm.model.id,
        remove: userService.isLoggedIn
      };

      editableController.mixin($scope, this, 'class', rights, classService.createClass, classService.updateClass, classService.deleteClass);

      vm.removeProperty = removeProperty;
      vm.addProperty = addProperty;
      vm.registerForm = form => classForm = form;

      function addProperty() {
        searchPredicateModal.openWithPredicationCreation(vm.model).result
          .then(predicate => classService.newProperty(predicate.id))
          .then(property => {
            vm.classInEdit.addProperty(property);
            classForm.openPropertyAndScrollTo(property);
          });
      }

      function removeProperty(property) {
        vm.classInEdit.removeProperty(property);
      }
    }
  };
};
