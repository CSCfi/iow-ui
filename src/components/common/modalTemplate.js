module.exports = function modalDirective() {
  return {
    restrict: 'E',
    transclude: true,
    template: require('./modalTemplate.html'),
    link($scope, element, attributes, ctrls, transclude) {
      const transclusion = transclude();
      const title = transclusion.filter('modal-title');
      const body = transclusion.filter('modal-body');
      const buttons = transclusion.filter('modal-buttons');

      if (buttons.size() === 0) {
        $scope.defaultButtons = true;
      }

      element.find('transcluded-title').append(title);
      element.find('transcluded-body').append(body);
      element.find('transcluded-buttons').append(buttons);
    }
  };
};
