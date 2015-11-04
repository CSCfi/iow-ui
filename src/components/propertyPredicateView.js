module.exports = function predicateView($log) {
  'ngInject';
  return {
    scope: {
      predicate: '='
    },
    restrict: 'E',
    template: require('./templates/propertyPredicateView.html'),
    controller() {
      'ngInject';
    }
  };
};
