const _ = require('lodash');

module.exports = function modelView() {
  'ngInject';

  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./modelView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['modelView', '^ngController'],
    link($scope, element, attributes, controllers) {
      $scope.modelController = controllers[1];
      $scope.modelController.registerView(controllers[0]);
    },
    controller($scope, modelService, searchSchemeModal, languageService, editableController) {
      'ngInject';

      editableController.mixin($scope, this, 'model', modelService.createModel, modelService.updateModel);

      const vm = this;
      vm.addReference = addReference;
      vm.removeReference = removeReverence;

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
