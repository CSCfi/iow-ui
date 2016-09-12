import { IScope } from 'angular';
import { LocationService, Location } from '../../services/locationService';

import { module as mod }  from './module';

mod.directive('breadcrumb', () => {
  return {
    scope: {},
    restrict: 'E',
    template: require('./breadcrumb.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: BreadcrumbController
  };
});

class BreadcrumbController {

  location: Location;

  /* @ngInject */
  constructor($scope: IScope, locationService: LocationService) {
    $scope.$watch(() => locationService.location, location => {
      this.location = location;
    });
  }
}
