module.exports = function predicateView($log) {
  'ngInject';
  return {
    scope: {
      predicate: '='
    },
    restrict: 'E',
    template: require('./propertyPredicateView.html'),
    controller() {
      'ngInject';
    }
  };
};
