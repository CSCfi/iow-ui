module.exports = function loginDirective() {
  return {
    scope: {},
    restrict: 'E',
    template: require('./login.html'),
    controllerAs: 'ctrl',
    controller: LoginController
  };
};

function LoginController($uibModal, userService) {
  'ngInject';

  const vm = this;

  vm.openLogin = openLogin;
  vm.getUser = userService.getUser;
  vm.logout = userService.logout;

  function openLogin() {
    $uibModal.open({
      template: require('./login-modal.html'),
      controller: ModalController,
      controllerAs: 'ctrl'
    });
  }
}


function ModalController($window, $uibModalInstance) {
  'ngInject';

  const vm = this;

  vm.login = login;
  vm.register = register;
  vm.close = $uibModalInstance.dismiss;

  function login() {
    $window.location.href = '/api/login';
  }

  function register() {
    $window.location.href = 'http://id.eduuni.fi/signup';
  }
}
