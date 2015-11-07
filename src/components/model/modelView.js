const _ = require('lodash');
const graphUtils = require('../../services/graphUtils');

module.exports = function classView($log) {
  'ngInject';

  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./modelView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    link($scope, element, attributes, modelController) {
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
    },
    controller($scope, userService, searchSchemeModal, modelService) {
      'ngInject';

      const vm = this;

      vm.modelInEdit = _.cloneDeep(vm.model);

      function isEditing() {
        return $scope.formController.visible();
      }

      vm.canEdit = () => {
        return !isEditing() && userService.isLoggedIn();
      };
      vm.canAddReference = () => {
        return isEditing() && userService.isLoggedIn();
      };
      vm.canRemoveReference = () => {
        return isEditing() && userService.isLoggedIn();
      };
      vm.addReference = () => {
        const model = graphUtils.graph(vm.modelInEdit);
        const referenceMap = _.indexBy(model.references, (reference) => reference['dct:identifier']);
        searchSchemeModal.open(referenceMap).result.then((reference) => {
          model.references.push(reference);
        });
      };
      vm.removeReference = (reference) => {
        _.remove(graphUtils.graph(vm.modelInEdit).references, reference);
      };
      vm.update = () => {
        $log.info(JSON.stringify(vm.modelInEdit, null, 2));
        return modelService.updateModel(vm.modelInEdit)
        .then(() => {
          vm.model = _.cloneDeep(vm.modelInEdit);
        });
      };
      vm.reset = () => {
        vm.modelInEdit = _.cloneDeep(vm.model);
      };
    }
  };
};
