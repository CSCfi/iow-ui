module.exports = function directive() {
  return {
    restrict: 'E',
    link: function($scope, element, attributes, controllers, $transclude) {
      $transclude(function(transclusion) {
        element.empty();
        element.append(transclusion.filter(attributes.name));
      });
    }
  };
};
