import IScope = angular.IScope;
import ILocationService = angular.ILocationService;
import { DefaultUser, Uri, internalUrl } from '../../services/entities';
import { UserService } from '../../services/userService';
import { LocationService } from '../../services/locationService';

const mod = angular.module('iow.components.user', ['iow.services']);

mod.directive('user', () => {
  return {
    restrict: 'E',
    template: require('./user.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: UserController
  };
});

class UserController {

  user: DefaultUser;

  /* @ngInject */
  constructor($scope: IScope, $location: ILocationService, userService: UserService, locationService: LocationService) {
    locationService.atUser();

    $scope.$watch(() => userService.user, user => {
      if (user instanceof DefaultUser) {
        this.user = user;
      } else {
        $location.url('/');
      }
    });
  }

  groupUrl(id: Uri) {
    return internalUrl(id, ['group']);
  }
}
