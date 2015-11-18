module.exports = function modalDirective() {
  return {
    restrict: 'E',
    transclude: {
      modalTitle: 'title',
      modalBody: 'body',
      modalButtons: '?buttons'
    },
    template: require('./modalTemplate.html'),
    link($scope, element, attributes) {
      $scope.defaultButtons = attributes.default;
    }
  };
};
