const _ = require('lodash');
const utils = require('../../services/utils');

module.exports = function classView($log) {
  'ngInject';

  return {
    scope: {},
    restrict: 'E',
    template: require('./modelView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['^ngController', '^form'],
    link($scope, element, attributes, controllers) {
      $scope.modelController = controllers[0];
      $scope.modelController.registerModelView($scope.ctrl);
      $scope.formController = controllers[1];
    },
    controller($scope, userService, searchSchemeModal, modelService, languageService) {
      'ngInject';

      let groupId = null;
      const vm = this;

      vm.submitError = false;
      vm.unsaved = false;
      vm.visible = false;
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;
      vm.select = select;
      vm.edit = edit;
      vm.canEdit = canEdit;
      vm.canAddReference = canAddReference;
      vm.canRemoveReference = canRemoveReference;
      vm.addReference = addReference;
      vm.removeReference = removeReverence;
      vm.update = update;

      $scope.$watch(userService.isLoggedIn, () => cancelEditing(true));

      function select(model, isUnsaved, creationGroupId) {
        vm.model = model;
        vm.modelInEdit = utils.clone(model);
        groupId = creationGroupId;

        vm.unsaved = isUnsaved;
        if (vm.unsaved) {
          edit();
        }
      }

      function update() {
        $log.info(JSON.stringify(vm.modelInEdit.serialize(), null, 2));

        return (vm.unsaved ? modelService.createModel(vm.modelInEdit, groupId) : modelService.updateModel(vm.modelInEdit))
          .then(() => {
            if (vm.unsaved) {
              $scope.modelController.modelCreated(vm.model);
            }
            vm.unsaved = false;
            vm.model = utils.clone(vm.modelInEdit);
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
          if (vm.unsaved) {
            $scope.modelController.modelCreated(false);
          } else {
            vm.modelInEdit = utils.clone(vm.model);
          }
        }
      }

      function edit() {
        vm.visible = true;
        $scope.formController.editing = true;
      }

      function isEditing() {
        return $scope.formController.editing;
      }

      function canEdit() {
        return !isEditing() && userService.isLoggedIn();
      }

      function canAddReference() {
        return isEditing() && userService.isLoggedIn();
      }

      function canRemoveReference() {
        return isEditing() && userService.isLoggedIn();
      }

      function addReference() {
        const language = languageService.getModelLanguage();
        const vocabularyMap = _.indexBy(vm.modelInEdit.references, (reference) => reference.vocabularyId);
        searchSchemeModal.open(vocabularyMap, language).result
          .then(scheme => modelService.newReference(scheme, language))
          .then(reference => vm.modelInEdit.addReference(reference));
      }

      function removeReverence(reference) {
        vm.modelInEdit.removeReference(reference);
      }
    }
  };
};
