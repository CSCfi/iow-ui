const _ = require('lodash');

module.exports = function editableControllerFactory($log, userService, confirmationModal) {
  'ngInject';
  return {
    mixin($scope, vm, editableName, rights, create, update, remove) {
      const editableInEditName = editableName + 'InEdit';

      vm.submitError = false;
      vm.saveEdited = saveEdited;
      vm.removeEdited = removeEdited;
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;
      vm.edit = edit;
      vm.canEdit = canEdit;
      vm.canModify = canModify;
      vm.canRemove = canRemove;
      vm.getEditable = getEditable;

      $scope.$watch(userService.isLoggedIn, (newUser, oldUser) => {
        if (newUser && oldUser) {
          cancelEditing();
        }
      });

      function getEditable() {
        return vm[editableName];
      }

      $scope.$watch(getEditable, select);

      function select(editable) {
        function clone(obj) {
          if (obj) {
            const cloned = Object.create(Object.getPrototypeOf(obj));
            _.merge(cloned, obj);
            return cloned;
          }
        }
        vm.submitError = false;
        vm[editableName] = editable;
        vm[editableInEditName] = clone(editable);

        if (editable && editable.unsaved) {
          edit();
        } else {
          cancelEditing();
        }
      }

      function saveEdited() {
        const editable = getEditable();
        const editableInEdit = vm[editableInEditName];
        $log.info(JSON.stringify(editableInEdit.serialize(), null, 2));

        const unsaved = editable.unsaved;
        (unsaved ? create(editableInEdit) : update(editableInEdit, editable.id))
          .then(() => {
            $scope.modelController.selectionEdited(editable, editableInEdit);
            select(editableInEdit);
          }, err => {
            $log.error(err);
            vm.submitError = true;
          });
      }

      function removeEdited() {
        const editable = getEditable();
        confirmationModal.openDeleteConfirm().result
          .then(remove(editable.id, vm.model.id))
          .then(() => {
            $scope.modelController.selectionDeleted(editable);
            select(null);
          });
      }

      function canRemove() {
        const editable = getEditable();
        return remove && editable && !editable.unsaved && !isEditing() && rights.remove();
      }

      function cancelEditing() {
        if (isEditing()) {
          vm.submitError = false;
          $scope.form.editing = false;
          const editable = getEditable();
          select(editable.unsaved ? null : editable);
        }
      }

      function edit() {
        $scope.form.editing = true;
      }

      function isEditing() {
        return $scope.form && $scope.form.editing;
      }

      function canEdit() {
        return !isEditing() && rights.edit();
      }

      function canModify() {
        return isEditing() && rights.edit();
      }
    }
  };
};
