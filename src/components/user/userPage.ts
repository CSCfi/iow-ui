import { IScope, ILocationService } from 'angular';
import { UserService } from '../../services/userService';
import { LocationService } from '../../services/locationService';
import { module as mod }  from './module';
import { Uri } from '../../entities/uri';
import { DefaultUser } from '../../entities/user';
import { groupUrl } from '../../utils/entity';

mod.directive('userPage', () => {
  return {
    restrict: 'E',
    template: require('./userPage.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: UserPageController
  };
});

class UserPageController {

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
