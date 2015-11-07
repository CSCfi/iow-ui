module.exports = function referencesView($log) {
  'ngInject';

  return {
    scope: {
      references: '='
    },
    restrict: 'E',
    template: require('./referencesView.html'),
    require: '^modelView',
    link($scope, element, attributes, modelViewController) {
      $scope.modelViewController = modelViewController;
    }
  };
};
