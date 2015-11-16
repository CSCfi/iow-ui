module.exports = function editableView() {
  return {
    restrict: 'E',
    scope: {
      editableController: '='
    },
    template: require('./editableButtons.html'),
    transclude: true
  };
};
