module.exports = function requiresView($log) {
  'ngInject';

  return {
    scope: {
      requires: '='
    },
    restrict: 'E',
    template: require('./requiresView.html')
  };
};
