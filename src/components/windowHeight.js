module.exports = function directive($window, userService) {
  'ngInject';
  return {
    scope: {
      padding: '=',
      loggedInPadding: '='
    },
    restrict: 'A',
    link($scope, element, attributes) {
      const minHeight = attributes.windowHeight;

      function getPadding() {
        const padding = $scope.padding || 0;
        const loggedInPadding = $scope.loggedInPadding || padding;
        return userService.isLoggedIn() ? loggedInPadding : padding;
      }

      function setHeight() {
        const height = $window.innerHeight - getPadding();
        if (minHeight) {
          element.css('min-height', height + 'px');
        } else {
          element.css('overflow-y', 'scroll').css('height', height + 'px');
        }
      }

      setHeight();
      angular.element($window).on('resize', setHeight);
      if ($scope.loggedInPadding) {
        $scope.$watch(userService.isLoggedIn, setHeight);
      }
    }
  };
};
