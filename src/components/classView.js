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
    link($scope, element) {
      const controller = $scope.ctrl;
      controller.modelController = element.controller('ngController');
      controller.modelController.registerView(controller);
      controller.formController = element.find('editable-form').controller('editableForm');
      $scope.$watch('ctrl.id', id => {
        controller.fetchClass(id);
      });
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller(classService) {
      'ngInject';

      let originalId;
      const vm = this;

      vm.fetchClass = fetchClass;
      vm.updateClass = updateClass;
      vm.resetModel = resetModel;
      // view contract
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

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
            vm.modelController.reload();
          });
        });
      }

      function resetModel() {
        fetchClass(originalId);
      }

      function isEditing() {
        return vm.formController.visible();
      }

      function cancelEditing() {
        vm.formController.cancel();
      }
    }
  };
};
