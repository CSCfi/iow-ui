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

      const vm = this;

      let originalId;

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
          vm.class = data['@graph'][0];
          vm.context = data['@context'];
          ensurePropertyAsArray(vm.class, 'property');
          originalId = id;
        }, err => {
          $log.error(err);
        }).finally(() => vm.loading = false);
      }

      function updateClass() {
        return predicateService.createUnsavedPredicates().then(() => {
          const classData = {
            '@graph': [vm.class],
            '@context': vm.context
          };

          const id = contextUtils.withFullIRI(vm.context, vm.class['@id']);

          $log.info(JSON.stringify(classData, null, 2));

          return classService.updateClass(classData, id, originalId).then(() => {
            originalId = id;
            vm.id = id;
            $scope.modelController.reload();
          });
        });
      }

      function resetModel() {
        predicateService.clearUnsavedPredicates();
        fetchClass(originalId);
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

      function createPropertyByPredicateId(predicateId, label) {
        classPropertyService.createPropertyForPredicateId(predicateId).then(property => {
          if (label) {
            property['@graph'][0].label = label;
          }
          vm.class.property.push(property['@graph'][0]);
        });
      }

      function createPropertyByConcept(conceptData) {
        const modelId = vm.class.isDefinedBy;
        predicateCreatorService.createPredicate(vm.context, modelId, conceptData.label, conceptData.conceptId, conceptData.type, modelLanguage.getLanguage()).then(predicate => {
          const predicateId = contextUtils.withFullIRI(predicate['@context'], predicate['@graph'][0]['@id']);
          predicateService.addUnsavedPredicate(predicateId, predicate);
          createPropertyByPredicateId(predicateId, predicate['@graph'][0].label);
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
