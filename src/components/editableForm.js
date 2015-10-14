module.exports = function editableForm($log) {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'E',
    transclude: true,
    template: require('./templates/editableForm.html'),
    controllerAs: 'formController',
    controller($scope, userService, modelLanguage) {
      'ngInject';

      const vm = this;

      vm.isLoggedIn = userService.isLoggedIn;
      vm.visible = visible;
      vm.show = show;
      vm.cancel = cancel;

      $scope.$watch(modelLanguage.getLanguage, cancel);

      function visible() {
        return $scope.form && $scope.form.$visible;
      }

      function show() {
        return $scope.form && $scope.form.$show();
      }

      function cancel() {
        return $scope.form && $scope.form.$cancel();
      }
    }
  };
};
