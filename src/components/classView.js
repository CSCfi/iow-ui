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
    controller($scope, classService, modelLanguage, userService, classPropertyService) {
      'ngInject';

      let originalId;
      const vm = this;

      vm.loading = true;
      vm.fetchClass = fetchClass;
      vm.updateClass = updateClass;
      vm.resetModel = resetModel;
      vm.addPropertyByPredicateId = addPropertyByPredicateId;
      // view contract
      vm.isEditing = isEditing;

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
          cancelEditing();
          vm.class = data['@graph'][0];
          vm.context = data['@context'];
          ensurePropertyAsArray(vm.class, 'property');
          originalId = id;
        }, err => {
          $log.error(err);
        }).finally(() => vm.loading = false);
      }

      function updateClass() {
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
      }

      function resetModel() {
        fetchClass(originalId);
      }

      function isEditing() {
        return $scope.formController.visible();
      }

      function cancelEditing() {
        $scope.formController.cancel();
      }

      function addPropertyByPredicateId(predicateId) {
        classPropertyService.getPropertyForPredicateId(predicateId).then(result => {
          vm.class.property.push(result['@graph'][0]);
        });
      }
    }
  };
};
