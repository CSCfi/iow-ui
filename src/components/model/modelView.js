const _ = require('lodash');

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

      vm.modelInEdit = vm.model.clone();

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
        searchSchemeModal.open(vocabularyMap).result.then((reference) => {
          vm.modelInEdit.addReference(reference);
        });
      };
      vm.removeReference = (reference) => {
        vm.modelInEdit.removeReference(reference);
      };
      vm.update = () => {
        $log.info(JSON.stringify(vm.modelInEdit.serialize(), null, 2));
        return modelService.updateModel(vm.modelInEdit)
        .then(() => {
          vm.model = vm.modelInEdit.clone();
        });
      };
      vm.reset = () => {
        vm.modelInEdit = vm.model.clone();
      };
    }
  };
};
