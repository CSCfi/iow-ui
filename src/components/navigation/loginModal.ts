import { IWindowService, ILocationService, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
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
