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
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
      modelController.registerModelView($scope.ctrl);
    },
    controller($scope, userService, searchSchemeModal, modelService, modelLanguage) {
      'ngInject';

      let groupId = null;
      const vm = this;

      vm.unsaved = false;
      vm.select = select;
      vm.canEdit = canEdit;
      vm.canAddReference = canAddReference;
      vm.canRemoveReference = canRemoveReference;
      vm.addReference = addReference;
      vm.removeReference = removeReverence;
      vm.update = update;
      vm.reset = reset;

      function select(model, isUnsaved, creationGroupId) {
        vm.model = model;
        vm.modelInEdit = utils.clone(model);
        groupId = creationGroupId;

        vm.unsaved = isUnsaved;
        if (vm.unsaved) {
          $scope.formController.show();
        }
      }

      function isEditing() {
        return $scope.formController.visible();
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
        const language = modelLanguage.getLanguage();
        const vocabularyMap = _.indexBy(vm.modelInEdit.references, (reference) => reference.vocabularyId);
        searchSchemeModal.open(vocabularyMap, language).result
          .then(scheme => modelService.newReference(scheme, language))
          .then(reference => vm.modelInEdit.addReference(reference));
      }

      function removeReverence(reference) {
        vm.modelInEdit.removeReference(reference);
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
          });
      }

      function reset() {
        if (vm.unsaved) {
          $scope.modelController.modelCreated(false);
        } else {
          vm.modelInEdit = utils.clone(vm.model);
        }
      }
    }
  };
};
