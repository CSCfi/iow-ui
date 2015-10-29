module.exports = function directive($window) {
  'ngInject';
  return {
    scope: {
      padding: '='
    },
    restrict: 'A',
    link($scope, element) {
      const padding = $scope.padding || 0;

      function setHeight() {
        const height = $window.innerHeight - padding;
        element.attr('style', 'overflow-y: scroll; height: ' + height + 'px');
      }

      setHeight(element, padding);
      angular.element($window).on('resize', setHeight);
    }
  };
};
