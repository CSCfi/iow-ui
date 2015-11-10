const utils = require('../../services/utils');

module.exports = function selectionView($log) {
  'ngInject';
  return {
    scope: {},
    restrict: 'E',
    template: require('./selectionView.html'),
    require: ['^ngController', '^form'],
    link($scope, element, attributes, controllers) {
      $scope.modelController = controllers[0];
      $scope.modelController.registerSelectionView($scope.ctrl);
      $scope.formController = controllers[1];
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, classService, predicateService, userService, searchPredicateModal, deleteConfirmModal) {
      'ngInject';

      let unsaved = false;
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

      $scope.$watch(userService.isLoggedIn, () => cancelEditing(true));

      function select(selection, isUnsaved) {
        vm.selection = selection;
        vm.selectionInEdit = utils.clone(selection);

        unsaved = isUnsaved;
        if (unsaved) {
          edit();
        }
      }

      function update() {
        $log.info(JSON.stringify(vm.selectionInEdit.serialize(), null, 2));

        return (vm.selection.isClass()
          ? unsaved
            ? classService.createClass(vm.selectionInEdit)
            : classService.updateClass(vm.selectionInEdit, vm.selection.id)
          : unsaved
            ? predicateService.createPredicate(vm.selectionInEdit)
            : predicateService.updatePredicate(vm.selectionInEdit, vm.selection.id))
        .then(() => {
          unsaved = false;
          vm.selection = utils.clone(vm.selectionInEdit);
          $scope.modelController.reload();
          cancelEditing(false);
        }, err => {
          $log.error(err);
          vm.submitError = true;
        });
      }

      function cancelEditing(shouldReset) {
        $scope.formController.editing = false;
        vm.submitError = false;
        if (shouldReset) {
          select(unsaved ? null : utils.clone(vm.selection));
        }
      }

      function remove() {
        const modelId = $scope.modelController.getModel().id;
        deleteConfirmModal.open().result.then(() => {
          return vm.selection.isClass()
            ? classService.deleteClass(vm.selection.id, modelId)
            : predicateService.deletePredicate(vm.selection.id, modelId);
        })
        .then(() => {
          select(null);
          $scope.modelController.reload();
        });
      }

      function edit() {
        $scope.formController.editing = true;
      }

      function isEditing() {
        return $scope.formController.editing;
      }

      function canEdit() {
        return !isEditing() && userService.isLoggedIn() && vm.selection && vm.selection.modelId === $scope.modelController.getModel().id;
      }

      function canRemove() {
        return userService.isLoggedIn() && !isEditing() && !unsaved;
      }

      function canAddProperty() {
        return vm.selection.isClass() && userService.isLoggedIn() && isEditing();
      }

      function canRemoveProperty() {
        return vm.selection.isClass() && userService.isLoggedIn() && isEditing();
      }

      function addProperty() {
        searchPredicateModal.openWithPredicationCreation($scope.modelController.getModel()).result.then(createPropertyByPredicateId);
      }

      function createPropertyByPredicateId(predicateId) {
        classService.newProperty(predicateId).then(property => {
          vm.selectionInEdit.addProperty(property);
        });
      }

      function removeProperty(property) {
        vm.selectionInEdit.removeProperty(property);
      }
    }
  };
};
