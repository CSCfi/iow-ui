module.exports = function propertyView($log) {
  'ngInject';
  return {
    scope: {
      property: '=',
      context: '='
    },
    restrict: 'E',
    template: require('./templates/propertyView.html'),
    controller($scope) {
      'ngInject';
    }
  };
};
