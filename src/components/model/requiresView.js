module.exports = function requiresView() {
  'ngInject';

  return {
    scope: {
      requires: '='
    },
    restrict: 'E',
    template: require('./requiresView.html'),
    require: '^modelView',
    link($scope, element, attributes, modelViewController) {
      $scope.modelViewController = modelViewController;
    }
  };
};
