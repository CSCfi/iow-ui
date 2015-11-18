module.exports = function propertyView($location, $timeout) {
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

      if ($location.search().property === controller.property.id) {
        controller.openAndScrollTo();
      }
    },
    controller($scope, predicateService) {
      'ngInject';

      const vm = this;
      vm.openAndScrollTo = openAndScrollTo;

      $scope.$watch(() => vm.isOpen, open => {
        if (open) {
          $location.search('property', vm.property.id);

          if (!vm.predicate) {
            predicateService.getPredicate(vm.property.predicateId).then(predicate => {
              vm.predicate = predicate;
            });
          }
        }
      });

      function openAndScrollTo() {
        vm.isOpen = true;
        $timeout(() => {
          $timeout(() => {
            vm.scroll();
          });
        });
      }
    }
  };
};
