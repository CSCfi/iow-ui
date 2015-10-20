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
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      const controller = $scope.ctrl;
      modelController.registerView(controller);
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, propertyService, modelLanguage, userService) {
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

      $scope.$watch('ctrl.id', id => fetchProperty(id));
      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

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
            $scope.modelController.reload();
          });
        });
      }

      function resetModel() {
        fetchProperty(originalId);
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
