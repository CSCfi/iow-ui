const utils = require('../../services/utils');

module.exports = function selectionView($log) {
  'ngInject';
  return {
    scope: {},
    restrict: 'E',
    template: require('./selectionView.html'),
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
      modelController.registerSelectionView($scope.ctrl);
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, classService, predicateService, modelLanguage, userService, searchPredicateModal, deleteConfirmModal) {
      'ngInject';

      let unsaved = false;
      const vm = this;

      vm.update = update;
      vm.reset = reset;
      vm.removeProperty = removeProperty;
      vm.addProperty = addProperty;
      vm.canAddProperty = canAddProperty;
      vm.canRemoveProperty = canRemoveProperty;
      vm.remove = remove;
      vm.canRemove = canRemove;
      vm.canEdit = canEdit;
      // view contract
      vm.select = select;
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function select(selection, isUnsaved) {
        vm.selection = selection;
        vm.selectionInEdit = utils.clone(selection);

        unsaved = isUnsaved;
        if (unsaved) {
          $scope.formController.show();
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
        });
      }

      function remove() {
        deleteConfirmModal.open().result.then(() => {
          return vm.selection.isClass()
            ? classService.deleteClass(vm.selection.id, $scope.modelController.modelId)
            : predicateService.deletePredicate(vm.selection.id, $scope.modelController.modelId);
        })
        .then(() => {
          select(null);
          $scope.modelController.reload();
        });
      }

      function reset() {
        select(unsaved ? null : utils.clone(vm.selection));
        $scope.modelController.reload();
      }

      function isEditing() {
        return $scope.formController.visible();
      }

      function canEdit() {
        return !isEditing() && userService.isLoggedIn() && vm.selection && vm.selection.modelId === $scope.modelController.modelId;
      }

      function canRemove() {
        return userService.isLoggedIn() && !isEditing() && !unsaved;
      }

      function cancelEditing(shouldReset) {
        $scope.formController.cancel(shouldReset);
      }

      function canAddProperty() {
        return vm.selection.isClass() && userService.isLoggedIn() && isEditing();
      }

      function canRemoveProperty() {
        return vm.selection.isClass() && userService.isLoggedIn() && isEditing();
      }

      function addProperty() {
        searchPredicateModal.openWithPredicationCreation($scope.modelController.model).result.then(createPropertyByPredicateId);
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
