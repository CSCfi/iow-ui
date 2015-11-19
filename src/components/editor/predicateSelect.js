module.exports = function predicateSelect() {
  'ngInject';
  return {
    scope: {
      curie: '=',
      type: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./predicateSelect.html'),
    require: '?^form',
    link($scope, element, attributes, formController) {
      $scope.formController = formController;
    },
    controller(searchPredicateModal) {
      'ngInject';
      const vm = this;
      vm.selectPredicate = () => {
        searchPredicateModal.openWithOnlySelection(vm.type).result.then(predicate => {
          vm.curie = predicate.curie;
        });
      };
    }
  };
};
