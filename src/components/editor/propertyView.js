module.exports = function propertyView() {
  'ngInject';
  return {
    scope: {
      property: '='
    },
    restrict: 'E',
    template: require('./propertyView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['propertyView', '^classForm', '?^classView'],
    link($scope, element, attributes, controllers) {
      const controller = controllers[0];
      $scope.editableController = controllers[2];
      controllers[1].registerPropertyView(controller.property.id, controller);
      controller.scroll = () => jQuery('html, body').animate({scrollTop: element.offset().top}, 'slow');
    },
    controller($scope, predicateService) {
      'ngInject';
      const vm = this;

      $scope.$watch(() => vm.isOpen, open => {
        if (open && !vm.predicate) {
          predicateService.getPredicate(vm.property.predicateId).then(predicate => {
            vm.predicate = predicate;
          });
        }
      });

      vm.openAndScrollTo = () => {
        vm.isOpen = true;
        vm.scroll();
      };
    }
  };
};
