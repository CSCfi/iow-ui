module.exports = function directive() {
  return {
    restrict: 'E',
    link($scope, element, attributes, controllers, transclude) {
      transclude(transclusion => {
        element.empty();
        element.append(transclusion.filter(attributes.name));
      });
    }
  };
};
