const _ = require('lodash');
const contextUtils = require('../services/contextUtils');

module.exports = function classView($log) {
  'ngInject';

  return {
    scope: {
      id: '='
    },
    restrict: 'E',
    template: require('./templates/classView.html'),
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      const controller = $scope.ctrl;
      modelController.registerView(controller);
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, classService, modelLanguage, userService, classPropertyService, searchPredicateModal, predicateCreatorService, predicateService) {
      'ngInject';

      let originalId;
      let unsaved = false;
      const vm = this;

      vm.loading = true;
      vm.fetchClass = fetchClass;
      vm.updateClass = updateClass;
      vm.resetModel = resetModel;
      vm.deleteProperty = deleteProperty;
      vm.addProperty = addProperty;
      vm.canAddProperty = canAddProperty;
      vm.deleteClass = deleteClass;
      vm.canDeleteClass = canDeleteClass;
      // view contract
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      $scope.$watch('ctrl.id', id => fetchClass(id));
      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function ensurePropertyAsArray(obj, property) {
        const propertyValue = obj[property];

        if (!Array.isArray(propertyValue)) {
          obj[property] = propertyValue ? [propertyValue] : [];
        }
      }

      function fetchClass(id) {
        vm.loading = true;
        classService.getClass(id).then(data => {
          vm.context = data['@context'];
          vm.class = data['@graph'][0];
          originalId = id;
          ensurePropertyAsArray(vm.class, 'property');
          unsaved = data.unsaved;
          if (unsaved) {
            $scope.formController.show();
          }
          vm.loading = false;
        });
      }

      function updateClass() {
        return predicateService.createUnsavedPredicates().then(() => {
          const classData = {
            '@graph': [vm.class],
            '@context': vm.context
          };

          const id = contextUtils.withFullIRI(vm.context, vm.class['@id']);

          $log.info(JSON.stringify(classData, null, 2));

          function updateView() {
            unsaved = false;
            originalId = id;
            vm.id = id;
            $scope.modelController.reload();
          }

          if (unsaved) {
            return classService.createClass(classData, id).then(() => {
              classService.clearUnsavedClasses();
              updateView();
            });
          } else {
            return classService.updateClass(classData, id, originalId).then(updateView);
          }
        });
      }

      function resetModel() {
        classService.clearUnsavedClasses();
        predicateService.clearUnsavedPredicates();
        if (unsaved) {
          $scope.modelController.deselect();
        } else {
          fetchClass(originalId);
        }
      }

      function isEditing() {
        return $scope.formController.visible();
      }

      function cancelEditing(reset) {
        $scope.formController.cancel(reset);
      }

      function canAddProperty() {
        return userService.isLoggedIn() && isEditing();
      }

      function canDeleteClass() {
        return userService.isLoggedIn();
      }

      function deleteClass() {
        // TODO
      }

      function addProperty() {
        searchPredicateModal.open().result.then(result => {
          if (typeof result === 'object') {
            createPropertyByConcept(result);
          } else {
            createPropertyByPredicateId(result);
          }
        });
      }

      function createPropertyByPredicateId(predicateId) {
        classPropertyService.createPropertyForPredicateId(predicateId).then(property => {
          vm.class.property.push(property['@graph'][0]);
        });
      }

      function createPropertyByConcept(conceptData) {
        const modelId = vm.class.isDefinedBy;
        predicateCreatorService.createPredicate(vm.context, modelId, conceptData.label, conceptData.conceptId, conceptData.type, modelLanguage.getLanguage()).then(predicate => {
          const predicateId = contextUtils.withFullIRI(predicate['@context'], predicate['@graph'][0]['@id']);
          predicateService.addUnsavedPredicate(predicate, vm.context);
          createPropertyByPredicateId(predicateId);
        }, err => {
          $log.error(err);
        });
      }

      function deleteProperty(property) {
        _.remove(vm.class.property, property);
      }
    }
  };
};
