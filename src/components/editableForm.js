module.exports = function editableForm($log) {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'E',
    transclude: true,
    template: require('./templates/editableForm.html'),
    controllerAs: 'formController',
    controller($scope, userService) {
      'ngInject';

      return {
        isLoggedIn: userService.isLoggedIn,
        visible() {
          return $scope.form && $scope.form.$visible;
        },
        show() {
          return $scope.form && $scope.form.$show();
        },
        cancel() {
          return $scope.form && $scope.form.$cancel();
        }
      }
    }
  };
};
