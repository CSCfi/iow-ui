const _ = require('lodash');
const graphUtils = require('../../services/graphUtils');

module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {},
    restrict: 'E',
    template: require('./classView.html'),
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
      modelController.registerClassView($scope.ctrl);
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, classService, modelLanguage, userService, classPropertyService, searchPredicateModal, deleteConfirmModal) {
      'ngInject';

      let originalClass;
      let unsaved = false;
      const vm = this;

      vm.updateClass = updateClass;
      vm.resetModel = resetModel;
      vm.deleteProperty = deleteProperty;
      vm.addProperty = addProperty;
      vm.canAddProperty = canAddProperty;
      vm.deleteClass = deleteClass;
      vm.canDeleteClass = canDeleteClass;
      vm.canEdit = canEdit;
      // view contract
      vm.selectClass = selectClass;
      vm.getSelectionId = getSelectionId;
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function getSelectionId() {
        return originalClass && graphUtils.withFullId(originalClass);
      }

      function selectClass(klass, isUnsaved) {
        vm.class = klass;
        originalClass = _.cloneDeep(klass);

        unsaved = isUnsaved;
        if (unsaved) {
          $scope.formController.show();
        }
      }

      function updateClass() {
        const id = graphUtils.withFullId(vm.class);
        const originalId = graphUtils.withFullId(originalClass);

        $log.info(JSON.stringify(vm.class, null, 2));

        function updateView() {
          unsaved = false;
          originalClass = _.cloneDeep(vm.class);
          $scope.modelController.reload();
        }

        if (unsaved) {
          return classService.createClass(vm.class, id).then(updateView);
        } else {
          return classService.updateClass(vm.class, id, originalId).then(updateView);
        }
      }

      function resetModel() {
        selectClass(unsaved ? null : originalClass);
        $scope.modelController.reload();
      }

      function isEditing() {
        return $scope.formController.visible();
      }

      function canEdit() {
        const graph = graphUtils.graph(vm.class);
        return userService.isLoggedIn() && graph && $scope.modelController.modelId === graph.isDefinedBy;
      }

      function cancelEditing(reset) {
        $scope.formController.cancel(reset);
      }

      function canAddProperty() {
        return userService.isLoggedIn() && isEditing();
      }

      function canDeleteClass() {
        return userService.isLoggedIn() && !isEditing() && !unsaved;
      }

      function deleteClass() {
        deleteConfirmModal.open().result.then(() => {
          const id = graphUtils.withFullId(vm.class);
          classService.deleteClass(id, $scope.modelController.modelId).then(() => {
            selectClass(null);
            $scope.modelController.reload();
          });
        });
      }

      function addProperty() {
        searchPredicateModal.openWithPredicationCreation($scope.modelController.model).result.then(createPropertyByPredicateId);
      }

      function createPropertyByPredicateId(predicateId) {
        classPropertyService.createPropertyForPredicateId(predicateId).then(property => {
          graphUtils.graph(vm.class).property.push(graphUtils.graph(property));
        });
      }

      function deleteProperty(property) {
        _.remove(graphUtils.graph(vm.class).property, property);
      }
    }
  };
};
