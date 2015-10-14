module.exports = function predicateView($log) {
  'ngInject';
  return {
    scope: {
      predicate: '='
    },
    restrict: 'E',
    template: require('./templates/predicateView.html'),
    controller($scope) {
      'ngInject';
    }
  };
};
