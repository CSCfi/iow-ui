import { IScope, ILocationService } from 'angular';
import { DefaultUser, groupUrl } from '../../services/entities';
import { UserService } from '../../services/userService';
import { LocationService } from '../../services/locationService';
import { module as mod }  from './module';
import { Uri } from '../../services/uri';

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
    return groupUrl(id.uri);
  }
}
