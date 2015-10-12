
module.exports = function loginDirective() {
  return {
    scope: {},
    restrict: 'E',
    template: require('./templates/login.html'),
    controllerAs: 'ctrl',
    controller: loginController
  };
};

function loginController($modal, userService) {
  'ngInject';
  return {
    openLogin() {
      $modal.open({
        template: require('./templates/login-modal.html'),
        controller: modalController,
        controllerAs: 'ctrl'
      });
    },
    isLoggedIn() {
      return userService.isLoggedIn();
    },
    logout() {
      userService.logout();
    }
  }
}

function modalController($window) {
  'ngInject';
  return {
    login() {
      $window.location.href = '/api/login';
    },
    register() {
      $window.location.href = 'http://eduuni.fi/registration.aspx';
    }
  }
}
