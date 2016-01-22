import IScope = angular.IScope;
import {User, DefaultUser} from '../../services/entities';
import { UserService } from '../../services/userService';
import {LocationService} from "../../services/locationService";
import ILocationService = angular.ILocationService;

export class UserController {

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
}
