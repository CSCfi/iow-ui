const utils = require('../../services/utils');

module.exports = function editableControllerFactory($log, userService) {
  'ngInject';
  return {
    mixin($scope, controllerAs, editableName, create, update, hasModifyRight) {
      const vm = $scope[controllerAs];
      const editableInEditName = editableName + 'InEdit';
      vm.submitError = false;
      vm.saveEdited = saveEdited;
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;
      vm.edit = edit;
      vm.canEdit = canEdit;
      vm.canModify = canModify;

      $scope.$watch(userService.isLoggedIn, (newUser, oldUser) => {
        if (newUser && oldUser) {
          cancelEditing();
        }
      });

      $scope.$watch(controllerAs + '.' + editableName, select);

      function select(editable) {
        vm[editableName] = editable;
        vm[editableInEditName] = utils.clone(editable);

        if (editable && editable.unsaved) {
          edit();
        } else {
          cancelEditing();
        }
      }

      function saveEdited() {
        $log.info(JSON.stringify(vm[editableInEditName].serialize(), null, 2));

        const unsaved = vm[editableName].unsaved;
        const edited = vm[editableInEditName];

        (unsaved ? create(edited) : update(edited))
          .then(() => select(edited),
            err => {
              $log.error(err);
              vm.submitError = true;
            });
      }

      function cancelEditing() {
        if (isEditing()) {
          vm.submitError = false;
          $scope.form.editing = false;
          select(vm[editableName].unsaved ? null : vm[editableName]);
        }
      }

      function edit() {
        $scope.form.editing = true;
      }

      function isEditing() {
        return $scope.form && $scope.form.editing;
      }

      function canEdit() {
        return !isEditing() && hasModifyRight();
      }

      function canModify() {
        return isEditing() && hasModifyRight();
      }
    }
  };
};
