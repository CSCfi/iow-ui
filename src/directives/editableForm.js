module.exports = function editableForm($log) {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'E',
    transclude: true,
    template: require('./templates/editableForm.html'),
    controller($scope) {
      'ngInject';
    }
  };
};
