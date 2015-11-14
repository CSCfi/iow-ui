module.exports = function directive() {
  return {
    scope: {},
    restrict: 'E',
    template: require('./breadcrumb.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, locationService) {
      'ngInject';
      $scope.$watch(locationService.getLocation, location => {
        this.location = location;
      });
    }
  };
};
