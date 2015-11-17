module.exports = function editableSubjectSelect() {
  'ngInject';
  return {
    scope: {
      subject: '=',
      references: '=',
      type: '@'
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableSubjectSelect.html'),
    require: '?^form',
    link($scope, element, attributes, formController) {
      $scope.formController = formController;
    },
    controller(searchConceptModal) {
      'ngInject';
      const vm = this;
      vm.selectSubject = () => {
        searchConceptModal.openSelection(vm.references, vm.type).result.then(concept => vm.subject = concept);
      };
    }
  };
};
