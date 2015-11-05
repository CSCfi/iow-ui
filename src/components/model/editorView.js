const _ = require('lodash');
const graphUtils = require('../../services/graphUtils');

module.exports = function entityView($log) {
  'ngInject';
  return {
    scope: {},
    restrict: 'E',
    template: require('./editorView.html'),
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
      modelController.registerEditorView($scope.ctrl);
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, classService, predicateService, modelLanguage, userService, classPropertyService, searchPredicateModal, deleteConfirmModal) {
      'ngInject';

      let originalEntity;
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
      vm.isClass = isClass;
      vm.isPredicate = isPredicate;
      // view contract
      vm.select = select;
      vm.getSelection = getSelection;
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function isClass() {
        return graphUtils.type(originalEntity) === 'class';
      }

      function isPredicate() {
        return _.contains(['association', 'attribute'], graphUtils.type(originalEntity));
      }

      function getSelection() {
        if (originalEntity) {
          return {id: graphUtils.withFullId(originalEntity), type: graphUtils.type(originalEntity)};
        }
      }

      function select(entity, isUnsaved) {
        vm.entity = entity;
        originalEntity = _.cloneDeep(entity);

        unsaved = isUnsaved;
        if (unsaved) {
          $scope.formController.show();
        }
      }

      function update() {
        const id = graphUtils.withFullId(vm.entity);
        const originalId = graphUtils.withFullId(originalEntity);

        $log.info(JSON.stringify(vm.entity, null, 2));

        function updateView() {
          unsaved = false;
          originalEntity = _.cloneDeep(vm.entity);
          $scope.modelController.reload();
        }

        if (isClass()) {
          if (unsaved) {
            return classService.createClass(vm.entity, id).then(updateView);
          } else {
            return classService.updateClass(vm.entity, id, originalId).then(updateView);
          }
        } else {
          if (unsaved) {
            return predicateService.createPredicate(vm.entity, id).then(updateView);
          } else {
            return predicateService.updatePredicate(vm.entity, id, originalId).then(updateView);
          }
        }
      }

      function reset() {
        select(unsaved ? null : originalEntity);
        $scope.modelController.reload();
      }

      function isEditing() {
        return $scope.formController.visible();
      }

      function canEdit() {
        const graph = graphUtils.graph(vm.entity);
        return userService.isLoggedIn() && graph && $scope.modelController.modelId === graph.isDefinedBy;
      }

      function cancelEditing(shouldReset) {
        $scope.formController.cancel(shouldReset);
      }

      function canAddProperty() {
        return isClass() && userService.isLoggedIn() && isEditing();
      }

      function canRemoveProperty() {
        return isClass() && userService.isLoggedIn() && isEditing();
      }

      function canRemove() {
        return userService.isLoggedIn() && !isEditing() && !unsaved;
      }

      function remove() {
        deleteConfirmModal.open().result.then(() => {
          return isClass()
            ? classService.deleteClass(getSelection().id, $scope.modelController.modelId)
            : predicateService.deletePredicate(getSelection().id, $scope.modelController.modelId);
        })
        .then(() => {
          select(null);
          $scope.modelController.reload();
        });
      }

      function addProperty() {
        searchPredicateModal.openWithPredicationCreation($scope.modelController.model).result.then(createPropertyByPredicateId);
      }

      function createPropertyByPredicateId(predicateId) {
        classPropertyService.createPropertyForPredicateId(predicateId).then(property => {
          graphUtils.graph(vm.entity).property.push(graphUtils.graph(property));
        });
      }

      function removeProperty(property) {
        _.remove(graphUtils.graph(vm.entity).property, property);
      }
    }
  };
};
