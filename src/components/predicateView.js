const _ = require('lodash');
const contextUtils = require('../services/contextUtils');

module.exports = function predicateView($log) {
  'ngInject';
  return {
    scope: {
      id: '=',
      type: '@'
    },
    restrict: 'E',
    template: require('./templates/predicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      const controller = $scope.ctrl;
      modelController.registerView(controller);
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
    },
    controller($scope, predicateService, modelLanguage, userService) {
      'ngInject';

      let context;
      let originalId;
      let unsaved = false;
      const vm = this;

      vm.loading = true;
      vm.updatepredicate = updatePredicate;
      vm.resetModel = resetModel;
      // view contract
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      $scope.$watch('ctrl.id', id => fetchPredicate(id));
      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function fetchPredicate(id) {
        vm.loading = true;
        predicateService.getPredicateById(id, vm.type + 'Frame').then(data => {
          context = data['@context'];
          originalId = id;
          vm.predicate = data['@graph'][0];
          unsaved = data.unsaved;
          if (unsaved) {
            $scope.formController.show();
          }
          vm.loading = false;
        });
      }

      function updatePredicate() {
        const ld = _.chain(vm.predicate)
          .clone()
          .assign({'@context': context})
          .value();

        const id = contextUtils.withFullIRI(context, vm.predicate['@id']);

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
