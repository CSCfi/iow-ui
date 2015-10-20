const _ = require('lodash');
const jsonld = require('jsonld');
const constants = require('./constants');

module.exports = function attributeView($log) {
  'ngInject';

  return {
    scope: {
      id: '='
    },
    restrict: 'E',
    template: require('./templates/attributeView.html'),
    link($scope, element) {
      const controller = $scope.ctrl;
      controller.modelController = element.controller('ngController');
      controller.modelController.registerView(controller);
      controller.formController = element.find('editable-form').controller('editableForm');
      $scope.$watch('ctrl.id', id => {
        controller.fetchProperty(id);
      });
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller(propertyService) {
      'ngInject';

      let context;
      let originalId;
      const vm = this;

      vm.fetchProperty = fetchProperty;
      vm.updateAttribute = updateAttribute;
      vm.resetModel = resetModel;
      vm.attributeValues = constants.attributeValues;
      // view contract
      vm.isEditing = isEditing;
      vm.cancelEditing = cancelEditing;

      function fetchProperty(id) {
        propertyService.getPropertyById(id).then(data => {
          vm.attribute = data['@graph'][0];
          context = data['@context'];
          originalId = id;
        });
      }

      function updateAttribute() {
        const ld = _.chain(vm.attribute)
          .clone()
          .assign({'@context': context})
          .value();

        return jsonld.promises.expand(ld).then(expanded => {
          const id = expanded[0]['@id'];
          return propertyService.updateProperty(ld, id, originalId).then(() => {
            originalId = id;
            vm.id = id;
            vm.modelController.reload();
          });
        });
      }

      function resetModel() {
        fetchProperty(originalId);
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
