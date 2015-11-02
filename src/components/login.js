module.exports = function loginDirective() {
  return {
    scope: {},
    restrict: 'E',
    template: require('./templates/login.html'),
    controllerAs: 'ctrl',
    controller: LoginController
  };
};

function LoginController($uibModal, userService) {
  'ngInject';

  const vm = this;

  vm.openLogin = openLogin;
  vm.isLoggedIn = isLoggedIn;
  vm.logout = logout;

  function openLogin() {
    $uibModal.open({
      template: require('./templates/login-modal.html'),
      controller: ModalController,
      controllerAs: 'ctrl'
    });
  }

  function isLoggedIn() {
    return userService.isLoggedIn();
  }

  function logout() {
    userService.logout();
  }
}


function ModalController($window, $uidModalInstance) {
  'ngInject';

  const vm = this;

  vm.login = login;
  vm.register = register;
  vm.close = $uidModalInstance.dismiss;

  function login() {
    $window.location.href = '/api/login';
  }

  function register() {
    $window.location.href = 'http://id.eduuni.fi/signup';
  }
}
