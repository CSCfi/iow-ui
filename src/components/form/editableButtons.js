module.exports = function editableView() {
  return {
    restrict: 'E',
    scope: {
      ctrl: '=editableController'
    },
    template: require('./editableButtons.html'),
    transclude: true
  };
};
