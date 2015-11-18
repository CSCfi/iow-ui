module.exports = function classForm() {
  'ngInject';
  return {
    scope: {
      class: '=',
      references: '=',
      editableController: '='
    },
    restrict: 'E',
    template: require('./classForm.html'),
    require: ['classForm', '?^classView'],
    controllerAs: 'ctrl',
    bindToController: true,
    link($scope, element, attributres, controllers) {
      const classViewController = controllers[1];
      if (classViewController) {
        classViewController.registerForm(controllers[0]);
      }
    },
    controller($scope, $timeout) {
      'ngInject';

      const vm = this;
      vm.propertyViews = {};

      vm.registerPropertyView = (propertyId, view) => vm.propertyViews[propertyId] = view;
      $scope.$watch(() => vm.class.properties, () => vm.propertyViews = {});

      vm.openPropertyAndScrollTo = property => {
        $timeout(() => {
          // wait for possible new view to appear
          vm.propertyViews[property.id].openAndScrollTo();
        });
      };
    }
  };
};
