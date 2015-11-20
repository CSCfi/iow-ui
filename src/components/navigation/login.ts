import IModalService = angular.ui.bootstrap.IModalService;
import {UserService} from "../../services/userService";
import {User} from "../../services/entities";
import IWindowService = angular.IWindowService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;

export const mod = angular.module('iow.components.navigation');

mod.directive('login', () => {
  return {
    scope: {},
    restrict: 'E',
    template: require('./login.html'),
    controllerAs: 'ctrl',
    controller: LoginController
  };
});

class LoginController {
  /* @ngInject */
  constructor(private $uibModal: IModalService, private userService: UserService) {
  }

  getUser(): User {
    return this.userService.user;
  }

  logout() {
    return this.userService.logout();
  }

  openLogin() {
    this.$uibModal.open({
      template: require('./login-modal.html'),
      controller: ModalController,
      controllerAs: 'ctrl'
    });
  }
}

class ModalController {
  /* @ngInject */
  constructor(private $window: IWindowService, private $uibModalInstance: IModalServiceInstance) {
  }

  close = this.$uibModalInstance.dismiss;

  login() {
    this.$window.location.href = '/api/login';
  }

  register() {
    this.$window.location.href = 'http://id.eduuni.fi/signup';
  }
}
