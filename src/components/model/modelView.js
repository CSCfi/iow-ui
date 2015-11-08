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
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
    },
    controller($scope, userService, searchSchemeModal, modelService) {
      'ngInject';

      const vm = this;

      vm.modelInEdit = utils.clone(vm.model);

      function isEditing() {
        return $scope.formController.visible();
      }

      vm.canEdit = () => {
        return !isEditing() && userService.isLoggedIn();
      };
      vm.canAddReference = () => {
        return isEditing() && userService.isLoggedIn();
      };
      vm.canRemoveReference = () => {
        return isEditing() && userService.isLoggedIn();
      };
      vm.addReference = () => {
        const vocabularyMap = _.indexBy(vm.modelInEdit.references, (reference) => reference.vocabularyId);
        searchSchemeModal.open(vocabularyMap).result
          .then(scheme => modelService.newReference(scheme))
          .then(reference => vm.modelInEdit.addReference(reference));
      };
      vm.removeReference = (reference) => {
        vm.modelInEdit.removeReference(reference);
      };
      vm.update = () => {
        $log.info(JSON.stringify(vm.modelInEdit.serialize(), null, 2));
        return modelService.updateModel(vm.modelInEdit)
        .then(() => {
          vm.model = utils.clone(vm.modelInEdit);
        });
      };
      vm.reset = () => {
        vm.modelInEdit = utils.clone(vm.model);
      };
    }
  };
};
