module.exports = function referencesView() {
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
