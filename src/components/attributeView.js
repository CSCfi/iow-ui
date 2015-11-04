const _ = require('lodash');
const contextUtils = require('../services/contextUtils');

module.exports = function attributeView($log) {
  'ngInject';
  return {
    scope: {
      id: '='
    },
    restrict: 'E',
    template: require('./templates/attributeView.html'),
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      const controller = $scope.ctrl;
      modelController.registerView(controller);
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, predicateService, modelLanguage, userService) {
      'ngInject';

      let context;
      let originalId;
      let unsaved = false;
      const vm = this;

      vm.loading = true;
      vm.updateAttribute = updateAttribute;
      vm.resetModel = resetModel;
      // view contract
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      $scope.$watch('ctrl.id', id => fetchPredicate(id));
      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function fetchPredicate(id) {
        vm.loading = true;
        predicateService.getPredicateById(id, 'attributeFrame').then(data => {
          context = data['@context'];
          originalId = id;
          vm.attribute = data['@graph'][0];
          unsaved = data.unsaved;
          if (unsaved) {
            $scope.formController.show();
          }
          vm.loading = false;
        });
      }

      function updateAttribute() {
        const ld = _.chain(vm.attribute)
          .clone()
          .assign({'@context': context})
          .value();

        const id = contextUtils.withFullIRI(context, vm.attribute['@id']);

        $log.info(JSON.stringify(ld, null, 2));

        function updateView() {
          unsaved = false;
          originalId = id;
          vm.id = id;
          $scope.modelController.reload();
        }

        if (unsaved) {
          return predicateService.createPredicate(ld, id).then(updateView);
        } else {
          return predicateService.updatePredicate(ld, id, originalId).then(updateView);
        }
      }

      function resetModel() {
        predicateService.clearUnsavedPredicates();
        if (unsaved) {
          $scope.modelController.deselect();
        } else {
          fetchPredicate(originalId);
        }
      }

      function isEditing() {
        return $scope.formController.visible();
      }

      function cancelEditing(reset) {
        $scope.formController.cancel(reset);
      }
    }
  };
};
