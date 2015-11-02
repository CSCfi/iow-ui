module.exports = function requiresView($log) {
  'ngInject';

  return {
    scope: {
      requires: '='
    },
    restrict: 'E',
    template: require('./templates/requiresView.html'),
    controller() {
      'ngInject';
    }
  };
};
