module.exports = function referencesView($log) {
  'ngInject';

  return {
    scope: {
      references: '='
    },
    restrict: 'E',
    template: require('./templates/referencesView.html'),
    controller($scope) {
      'ngInject';
    }
  };
};
