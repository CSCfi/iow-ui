const _ = require('lodash');
const graphUtils = require('../services/graphUtils');

module.exports = function predicateView($log) {
  'ngInject';
  return {
    scope: {},
    restrict: 'E',
    template: require('./templates/predicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
      modelController.registerPredicateView($scope.ctrl);
    },
    controller($scope, predicateService, modelLanguage, userService, deleteConfirmModal) {
      'ngInject';

      let originalPredicate;
      let unsaved = false;
      const vm = this;

      vm.updatePredicate = updatePredicate;
      vm.resetModel = resetModel;
      vm.deletePredicate = deletePredicate;
      vm.canDeletePredicate = canDeletePredicate;
      vm.canEdit = canEdit;
      // view contract
      vm.selectPredicate = selectPredicate;
      vm.getSelectionId = getSelectionId;
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function getSelectionId() {
        return originalPredicate && graphUtils.withFullId(originalPredicate);
      }

      function selectPredicate(predicate, isUnsaved) {
        originalPredicate = _.cloneDeep(predicate);
        vm.predicate = predicate;

        unsaved = isUnsaved;
        if (unsaved) {
          $scope.formController.show();
        }
      }

      function updatePredicate() {
        const id = graphUtils.withFullId(vm.predicate);
        const originalId = graphUtils.withFullId(originalPredicate);

        $log.info(JSON.stringify(vm.predicate, null, 2));

        function updateView() {
          unsaved = false;
          originalPredicate = _.cloneDeep(vm.predicate);
          $scope.modelController.reload();
        }

        if (unsaved) {
          return predicateService.createPredicate(vm.predicate, id).then(updateView);
        } else {
          return predicateService.updatePredicate(vm.predicate, id, originalId).then(updateView);
        }
      }

      function resetModel() {
        selectPredicate(unsaved ? null : originalPredicate);
        $scope.modelController.reload();
      }

      function canDeletePredicate() {
        return userService.isLoggedIn() && !isEditing() && !unsaved;
      }

      function deletePredicate() {
        deleteConfirmModal.open().result.then(() => {
          const id = graphUtils.withFullId(vm.predicate);
          predicateService.deletePredicate(id, $scope.modelController.modelId).then(() => {
            selectPredicate(null);
            $scope.modelController.reload();
          });
        });
      }

      function isEditing() {
        return $scope.formController.visible();
      }

      function canEdit() {
        const graph = graphUtils.graph(vm.predicate);
        return userService.isLoggedIn() && graph && $scope.modelController.modelId === graph.isDefinedBy;
      }

      function cancelEditing(reset) {
        return $scope.formController.cancel(reset);
      }
    }
  };
};
