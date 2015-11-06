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
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function select(selection, isUnsaved) {
        vm.selection = selection;
        vm.selectionInEdit = _.cloneDeep(selection);

        unsaved = isUnsaved;
        if (unsaved) {
          $scope.formController.show();
        }
      }

      function update() {
        const id = graphUtils.withFullId(vm.selectionInEdit);
        const originalId = graphUtils.withFullId(vm.selection);

        $log.info(JSON.stringify(vm.selectionInEdit, null, 2));

        return selectionIsClass()
          ? unsaved
            ? classService.createClass(vm.selectionInEdit, id)
            : classService.updateClass(vm.selectionInEdit, id, originalId)
          : unsaved
            ? predicateService.createPredicate(vm.selectionInEdit, id)
            : predicateService.updatePredicate(vm.selectionInEdit, id, originalId)
        .then(() => {
          unsaved = false;
          vm.selection = _.cloneDeep(vm.selectionInEdit);
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
        select(unsaved ? null : vm.selection);
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
          graphUtils.graph(vm.selectionInEdit).property.push(graphUtils.graph(property));
        });
      }

      function removeProperty(property) {
        _.remove(graphUtils.graph(vm.selectionInEdit).property, property);
      }

      function selectionIsClass() {
        return graphUtils.type(vm.selection) === 'class';
      }

      function selectionIsPredicate() {
        return !selectionIsClass();
      }
    }
  };
};
