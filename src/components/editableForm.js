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
    controller($scope, $timeout, userService) {
      'ngInject';

      const vm = this;

      vm.isLoggedIn = userService.isLoggedIn;
      vm.visible = visible;
      vm.show = show;
      vm.cancel = cancel;
      vm.onSubmit = onSubmit;
      vm.submitError = false;

      function onSubmit() {
        function onError() {
          vm.submitError = true;
        }

        function onSuccess() {
          vm.submitError = false;
          cancel(false);
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
        // FIXME: hack
        // wait for changes to settle in scope
        $timeout(() => {
          return $scope.form.$show();
        });
      }

      function cancel(reset = true) {
        if (visible()) {
          if (reset) {
            vm.onReset();
          }
          vm.submitError = false;
          return $scope.form.$cancel();
        }
      }
    }
  };
};
