import IScope = angular.IScope;
import {LocationService} from "../../services/locationService";

export const mod = angular.module('iow.components.navigation');

mod.directive('breadcrumb', () => {
  return {
    scope: {},
    restrict: 'E',
    template: require('./breadcrumb.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope: IScope, locationService: LocationService) {
      'ngInject';
      $scope.$watch(() => locationService.location, location => {
        this.location = location;
      });
    }
  };
});
