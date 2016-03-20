import IScope = angular.IScope;
import ILocationService = angular.ILocationService;
import { UserService } from '../services/userService';
import { config } from '../config';

import { module as mod }  from './module';

mod.directive('application', () => {
  return {
    restrict: 'E',
    template: require('./application.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    controller: ApplicationController
  };
});

class ApplicationController {

  applicationInitialized: boolean;
  showFooter: boolean;
  production: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              $location: ILocationService,
              private userService: UserService) {

    userService.updateLogin().then(() => this.applicationInitialized = true);
    $scope.$watch(() => $location.path(), path => this.showFooter = path === '/');
    this.production = config.production;
  }
}
