import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IWindowService = angular.IWindowService;
import { User } from '../../services/entities';
import { UserService } from '../../services/userService';

export class LoginModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open() {
    this.$uibModal.open({
      template: require('./loginModal.html'),
      controller: LoginModalController,
      controllerAs: 'ctrl'
    });
  }
}

class LoginModalController {
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
