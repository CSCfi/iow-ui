module.exports = function predicateView($log) {
  'ngInject';
  return {
    scope: {
      property: '=predicate'
    },
    restrict: 'E',
    template: require('./templates/predicateView.html'),
    controller($scope) {
      'ngInject';
    }
  };
};
