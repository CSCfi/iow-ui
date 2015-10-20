const _ = require('lodash');
const jsonld = require('jsonld');

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
    controller($scope, classService, modelLanguage, userService) {
      'ngInject';

      let originalId;
      const vm = this;

      vm.fetchClass = fetchClass;
      vm.updateClass = updateClass;
      vm.resetModel = resetModel;
      // view contract
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      $scope.$watch('ctrl.id', id => fetchClass(id));
      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function fetchClass(id) {
        classService.getClass(id).then(data => {
          vm.class = data['@graph'][0];
          vm.context = data['@context'];
          originalId = id;
        }, err => {
          $log.error(err);
        });
      }

      function updateClass() {
        const classData = {
          '@graph': [vm.class],
          '@context': vm.context
        };

        return jsonld.promises.expand(classData).then(expanded => {
          const id = expanded[0]['@id'];
          return classService.updateClass(classData, id, originalId).then(() => {
            originalId = id;
            vm.id = id;
            $scope.modelController.reload();
          });
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
    }
  };
};
