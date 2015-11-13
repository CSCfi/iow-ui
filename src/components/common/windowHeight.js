module.exports = function directive($window, userService) {
  'ngInject';
  return {
    restrict: 'A',
    link($scope, element, attributes) {
      const minHeight = attributes.windowHeight === 'min';
      const noScroll = attributes.windowHeight === 'no-scroll';

      function getPadding() {
        const padding = attributes.padding || 0;
        const loggedInPadding = attributes.loggedInPadding || padding;
        return userService.isLoggedIn() ? loggedInPadding : padding;
      }

      function setHeight() {
        const height = $window.innerHeight - getPadding();
        if (minHeight) {
          element.css('min-height', height + 'px');
        } else {
          element.css('overflow-y', noScroll ? 'hidden' : 'scroll').css('height', height + 'px');
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
