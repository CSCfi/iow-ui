const _ = require('lodash');
const utils = require('../../services/utils');

module.exports = function classView($log) {
  'ngInject';

  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./modelView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['^ngController', '^form'],
    link($scope, element, attributes, controllers) {
      $scope.modelController = controllers[0];
      $scope.modelController.registerView($scope.ctrl);
      $scope.formController = controllers[1];
    },
    controller($scope, userService, searchSchemeModal, modelService, languageService) {
      'ngInject';

      const vm = this;

      vm.submitError = false;
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

      $scope.$watch(userService.isLoggedIn, (newUser, oldUser) => {
        if (newUser && oldUser) {
          cancelEditing();
        }
      });

      $scope.$watch('ctrl.model', select);

      function select(model) {
        vm.model = model;
        vm.modelInEdit = utils.clone(model);

        if (model && model.unsaved) {
          edit();
        } else {
          cancelEditing();
        }
      }

      function update() {
        $log.info(JSON.stringify(vm.modelInEdit.serialize(), null, 2));

        const unsaved = vm.model.unsaved;

        return (unsaved ? modelService.createModel(vm.modelInEdit) : modelService.updateModel(vm.modelInEdit))
          .then(() => select(vm.modelInEdit),
            err => {
              $log.error(err);
              vm.submitError = true;
            });
      }

      function cancelEditing() {
        if (isEditing()) {
          vm.submitError = false;
          $scope.formController.editing = false;
          select(vm.model.unsaved ? null : vm.model);
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
