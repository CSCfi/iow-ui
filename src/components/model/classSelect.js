module.exports = function editableClassSelect() {
  'ngInject';
  return {
    scope: {
      title: '@',
      className: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./classSelect.html'),
    require: '^form',
    link($scope, element, attributes, formController) {
      $scope.formController = formController;
    },
    controller(searchClassModal) {
      'ngInject';
      const vm = this;
      vm.selectClass = () => {
        searchClassModal.openWithOnlySelection().result.then(klass => {
          vm.className = klass.idName;
        });
      };
    }
  };
};
