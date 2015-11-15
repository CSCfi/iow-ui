const utils = require('../../services/utils');

module.exports = function selectionView($log) {
  'ngInject';
  return {
    scope: {
      model: '=',
      selection: '='
    },
    restrict: 'E',
    template: require('./selectionView.html'),
    require: ['^ngController', '^form'],
    link($scope, element, attributes, controllers) {
      $scope.modelController = controllers[0];
      $scope.modelController.registerView($scope.ctrl);
      $scope.formController = controllers[1];
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, classService, predicateService, userService, searchPredicateModal, confirmationModal) {
      'ngInject';

      const vm = this;

      vm.submitError = false;
      vm.update = update;
      vm.removeProperty = removeProperty;
      vm.addProperty = addProperty;
      vm.canAddProperty = canAddProperty;
      vm.canRemoveProperty = canRemoveProperty;
      vm.remove = remove;
      vm.canRemove = canRemove;
      vm.canEdit = canEdit;
      // view contract
      vm.isEditing = isEditing;
      vm.select = select;
      vm.edit = edit;
      vm.cancelEditing = cancelEditing;

      $scope.$watch(userService.isLoggedIn, (newUser, oldUser) => {
        if (newUser && oldUser) {
          cancelEditing();
        }
      });

      $scope.$watch('ctrl.selection', select);

      function select(selection) {
        vm.selection = selection;
        vm.selectionInEdit = utils.clone(selection);

        if (selection && selection.unsaved) {
          edit();
        } else {
          cancelEditing();
        }
      }

      function update() {
        $log.info(JSON.stringify(vm.selectionInEdit.serialize(), null, 2));

        return (vm.selection.isClass()
          ? vm.selection.unsaved
            ? classService.createClass(vm.selectionInEdit)
            : classService.updateClass(vm.selectionInEdit, vm.selection.id)
          : vm.selection.unsaved
            ? predicateService.createPredicate(vm.selectionInEdit)
            : predicateService.updatePredicate(vm.selectionInEdit, vm.selection.id))
        .then(() => {
          $scope.modelController.selectionEdited(vm.selection, vm.selectionInEdit);
          select(utils.clone(vm.selectionInEdit));
        }, err => {
          $log.error(err);
          vm.submitError = true;
        });
      }

      function cancelEditing() {
        if (isEditing()) {
          vm.submitError = false;
          $scope.formController.editing = false;
          select(vm.selection.unsaved ? null : vm.selection);
        }
      }

      function remove() {
        confirmationModal.openDeleteConfirm().result.then(() => {
          return vm.selection.isClass()
            ? classService.deleteClass(vm.selection.id, vm.model.id)
            : predicateService.deletePredicate(vm.selection.id, vm.model.id);
        })
        .then(() => {
          $scope.modelController.selectionDeleted(vm.selection);
          select(null);
        });
      }

      function edit() {
        $scope.formController.editing = true;
      }

      function isEditing() {
        return $scope.formController.editing;
      }

      function canEdit() {
        return !isEditing() && userService.isLoggedIn() && vm.selection && vm.selection.modelId === vm.model.id;
      }

      function canRemove() {
        return userService.isLoggedIn() && !isEditing() && !vm.selection.unsaved;
      }

      function canAddProperty() {
        return vm.selection.isClass() && userService.isLoggedIn() && isEditing();
      }

      function canRemoveProperty() {
        return vm.selection.isClass() && userService.isLoggedIn() && isEditing();
      }

      function addProperty() {
        searchPredicateModal.openWithPredicationCreation(vm.model).result.then(createPropertyByPredicate);
      }

      function createPropertyByPredicate(predicate) {
        classService.newProperty(predicate.id).then(property => {
          vm.selectionInEdit.addProperty(property);
        });
      }

      function removeProperty(property) {
        vm.selectionInEdit.removeProperty(property);
      }
    }
  };
};
