const _ = require('lodash');
const graphUtils = require('../../services/graphUtils');

module.exports = function entityView($log) {
  'ngInject';
  return {
    scope: {},
    restrict: 'E',
    template: require('./selectionView.html'),
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
      modelController.registerSelectionView($scope.ctrl);
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, classService, predicateService, modelLanguage, userService, classPropertyService, searchPredicateModal, deleteConfirmModal) {
      'ngInject';

      let originalSelection;
      let unsaved = false;
      const vm = this;

      vm.update = update;
      vm.reset = reset;
      vm.removeProperty = removeProperty;
      vm.addProperty = addProperty;
      vm.canAddProperty = canAddProperty;
      vm.canRemoveProperty = canRemoveProperty;
      vm.remove = remove;
      vm.canRemove = canRemove;
      vm.canEdit = canEdit;
      vm.selectionIsClass = selectionIsClass;
      vm.selectionIsPredicate = selectionIsPredicate;
      // view contract
      vm.select = select;
      vm.getSelection = getSelection;
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function selectionIsClass() {
        return graphUtils.type(originalSelection) === 'class';
      }

      function selectionIsPredicate() {
        return !selectionIsClass();
      }

      function getSelection() {
        return originalSelection;
      }

      function select(selection, isUnsaved) {
        vm.selection = selection;
        originalSelection = _.cloneDeep(selection);

        unsaved = isUnsaved;
        if (unsaved) {
          $scope.formController.show();
        }
      }

      function update() {
        const id = graphUtils.withFullId(vm.selection);
        const originalId = graphUtils.withFullId(originalSelection);

        $log.info(JSON.stringify(vm.selection, null, 2));

        return selectionIsClass()
          ? unsaved
            ? classService.createClass(vm.selection, id)
            : classService.updateClass(vm.selection, id, originalId)
          : unsaved
            ? predicateService.createPredicate(vm.selection, id)
            : predicateService.updatePredicate(vm.selection, id, originalId)
        .then(() => {
          unsaved = false;
          originalSelection = _.cloneDeep(vm.selection);
          $scope.modelController.reload();
        });
      }

      function remove() {
        deleteConfirmModal.open().result.then(() => {
          return selectionIsClass()
            ? classService.deleteClass(getSelection().id, $scope.modelController.modelId)
            : predicateService.deletePredicate(getSelection().id, $scope.modelController.modelId);
        })
        .then(() => {
          select(null);
          $scope.modelController.reload();
        });
      }

      function reset() {
        select(unsaved ? null : originalSelection);
        $scope.modelController.reload();
      }

      function isEditing() {
        return $scope.formController.visible();
      }

      function canEdit() {
        const graph = graphUtils.graph(vm.selection);
        return userService.isLoggedIn() && graph && $scope.modelController.modelId === graph.isDefinedBy;
      }

      function canRemove() {
        return userService.isLoggedIn() && !isEditing() && !unsaved;
      }

      function cancelEditing(shouldReset) {
        $scope.formController.cancel(shouldReset);
      }

      function canAddProperty() {
        return selectionIsClass() && userService.isLoggedIn() && isEditing();
      }

      function canRemoveProperty() {
        return selectionIsClass() && userService.isLoggedIn() && isEditing();
      }

      function addProperty() {
        searchPredicateModal.openWithPredicationCreation($scope.modelController.model).result.then(createPropertyByPredicateId);
      }

      function createPropertyByPredicateId(predicateId) {
        classPropertyService.createPropertyForPredicateId(predicateId).then(property => {
          graphUtils.graph(vm.selection).property.push(graphUtils.graph(property));
        });
      }

      function removeProperty(property) {
        _.remove(graphUtils.graph(vm.selection).property, property);
      }
    }
  };
};
