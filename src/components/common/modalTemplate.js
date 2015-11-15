module.exports = function modalDirective() {
  return {
    restrict: 'E',
    transclude: true,
    template: require('./modalTemplate.html'),
    link($scope, element, attributes, ctrls, transclude) {
      const transclusion = transclude();
      if (transclusion.filter('modal-buttons').size() === 0) {
        $scope.defaultButtons = true;
      }
    }
  };
};
