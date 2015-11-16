const _ = require('lodash');

module.exports = function classView() {
  'ngInject';

  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./modelView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      modelController.registerView($scope.ctrl);
    },
    controller($scope, userService, modelService, searchSchemeModal, languageService, editableController) {
      'ngInject';

      const vm = this;

      editableController.mixin($scope, 'ctrl', 'model', modelService.createModel, modelService.updateModel, hasModifyRight);

      vm.addReference = addReference;
      vm.removeReference = removeReverence;

      function hasModifyRight() {
        return userService.isLoggedIn();
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
