module.exports = function editableForm() {
  'ngInject';
  return {
    scope: {
      actualOnSubmit: '&onSubmit',
      onReset: '&'
    },
    restrict: 'E',
    transclude: true,
    template: require('./templates/editableForm.html'),
    controllerAs: 'formController',
    bindToController: true,
    controller($scope, $timeout, userService, modelLanguage) {
      'ngInject';

      const vm = this;

      vm.isLoggedIn = userService.isLoggedIn;
      vm.visible = visible;
      vm.show = show;
      vm.cancel = cancel;
      vm.onSubmit = onSubmit;
      vm.submitError = false;

      $scope.$watch(modelLanguage.getLanguage, cancel);

      function onSubmit() {
        function onError() {
          vm.submitError = true;
          $scope.$apply();
        }

        function onSuccess() {
          vm.submitError = false;
          cancel();
          $scope.$apply();
        }

        // FIXME: hack
        // wait for changes to settle in scope
        $timeout(() => {
          // expected to be $http promise
          const result = vm.actualOnSubmit();

          if (result) {
            result.then(onSuccess, onError);
          } else {
            onSuccess();
          }
        });

        return ''; // prevents editable form to exit editing mode because our success callback does it
      }

      function visible() {
        return $scope.form && $scope.form.$visible;
      }

      function show() {
        return $scope.form && $scope.form.$show();
      }

      function cancel() {
        if (vm.submitError) {
          vm.onReset();
        }
        vm.submitError = false;
        if ($scope.form) {
          $scope.form.$cancel();
        }
      }
    }
  };
};
