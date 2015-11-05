module.exports = function referencesView($log) {
  'ngInject';

  return {
    scope: {
      references: '='
    },
    restrict: 'E',
    template: require('./referencesView.html'),
    controller() {
      'ngInject';
    }
  };
};
