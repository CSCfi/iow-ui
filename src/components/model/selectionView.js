const utils = require('../../services/utils');

module.exports = function selectionView() {
  'ngInject';
  return {
    scope: {
      model: '=',
      selection: '='
    },
    restrict: 'E',
    template: require('./selectionView.html'),
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      modelController.registerView($scope.ctrl);
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, classService, predicateService, userService, searchPredicateModal, confirmationModal, editableController) {
      'ngInject';

      const vm = this;

      editableController.mixin($scope, 'ctrl', 'selection', create, update, hasModifyRight);

      vm.removeProperty = removeProperty;
      vm.addProperty = addProperty;
      vm.canModifyProperty = canModifyProperty;
      vm.remove = remove;
      vm.canRemove = canRemove;

      function create() {
        return vm.selection.isClass()
          ? classService.createClass(vm.selectionInEdit)
          : predicateService.createPredicate(vm.selectionInEdit);
      }

      function update() {
        return vm.selection.isClass()
            ? classService.updateClass(vm.selectionInEdit, vm.selection.id)
            : predicateService.updatePredicate(vm.selectionInEdit, vm.selection.id);
      }

      function remove() {
        confirmationModal.openDeleteConfirm().result.then(() => {
          return vm.selection.isClass()
            ? classService.deleteClass(vm.selection.id, vm.model.id)
            : predicateService.deletePredicate(vm.selection.id, vm.model.id);
        })
        .then(() => {
          $scope.modelController.selectionDeleted(vm.selection);
          vm.selection = null;
        });
      }

      function hasModifyRight() {
        return userService.isLoggedIn();
      }

      function canRemove() {
        return !vm.selection.unsaved && vm.canEdit();
      }

      function canModifyProperty() {
        return vm.selection.isClass() && vm.canModify();
      }

      function addProperty() {
        searchPredicateModal.openWithPredicationCreation(vm.model).result
          .then(predicate => classService.newProperty(predicate.id))
          .then(property => vm.selectionInEdit.addProperty(property));
      }

      function removeProperty(property) {
        vm.selectionInEdit.removeProperty(property);
      }
    }
  };
};
