import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IWindowService = angular.IWindowService;
import ILocationService = angular.ILocationService;
import { config } from '../../config';

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
  constructor(private $location: ILocationService, private $window: IWindowService, private $uibModalInstance: IModalServiceInstance) {
  }

  close = this.$uibModalInstance.dismiss;

  login() {
    this.$window.location.href = config.apiEndpoint + `/login?target=${encodeURIComponent(this.$location.absUrl())}`;
  }

  register() {
    this.$window.location.href = 'http://id.eduuni.fi/signup';
  }
}
