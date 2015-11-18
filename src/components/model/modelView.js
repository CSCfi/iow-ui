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
    controller($scope, modelService, searchSchemeModal, searchRequireModal, languageService, editableController) {
      'ngInject';

      editableController.mixin($scope, this, 'model', modelService.createModel, modelService.updateModel);

      const vm = this;
      let referencesView;
      let requiresView;
      vm.addReference = addReference;
      vm.removeReference = removeReverence;
      vm.addRequire = addRequire;
      vm.removeRequire = removeRequire;
      vm.registerReferencesView = view => referencesView = view;
      vm.registerRequiresView = view => requiresView = view;

      $scope.$watch(vm.isEditing, editing => {
        if (editing) {
          vm.visible = true;
        }
      });

      function addReference() {
        const language = languageService.getModelLanguage();
        const vocabularyMap = _.indexBy(vm.modelInEdit.references, (reference) => reference.vocabularyId);
        searchSchemeModal.open(vocabularyMap, language).result
          .then(scheme => modelService.newReference(scheme, language))
          .then(reference => {
            vm.modelInEdit.addReference(reference);
            referencesView.open(reference);
          });
      }

      function removeReverence(reference) {
        vm.modelInEdit.removeReference(reference);
      }

      function addRequire() {
        const language = languageService.getModelLanguage();
        const requireMap = _.indexBy(vm.modelInEdit.requires, (require) => require.id);
        requireMap[vm.model.id] = vm.model;
        searchRequireModal.open(requireMap, language).result
          .then(require => {
            vm.modelInEdit.addRequire(require);
            requiresView.open(require);
          });
      }

      function removeRequire(require) {
        vm.modelInEdit.removeRequire(require);
      }
    }
  };
};
