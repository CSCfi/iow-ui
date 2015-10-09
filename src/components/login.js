
export default function directiveConfig() {
  return {
    scope: {},
    restrict: 'E',
    template: require('./templates/login.html'),
    controllerAs: 'ctrl',
    controller: LoginController
  };
};

class LoginController {
  /*@ngInject*/
  constructor($modal, userService) {
    this.$modal = $modal;
    this.userService = userService;
  }

  openLogin() {
    this.$modal.open({
      template: require('./templates/login-modal.html'),
      controller: ModalController,
      controllerAs: 'ctrl'
    });
  }

  isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  logout() {
    this.userService.logout();
  }
}

class ModalController {
  /*@ngInject*/
  constructor($modalInstance, $window, userService) {
    this.$modalInstance = $modalInstance;
    this.$window = $window;
    this.userService = userService;
  }

  fakeLogin() {
    this.userService.fakeLogin();
    this.$modalInstance.dismiss();
  }

  login() {
    this.$window.location.href = '/api/login';
  }

  register() {
    this.$window.location.href = 'http://eduuni.fi/registration.aspx';
  }
}
