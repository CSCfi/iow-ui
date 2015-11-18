module.exports = function selectionView() {
  'ngInject';
  return {
    scope: {
      editableController: '='
    },
    restrict: 'E',
    template: require('./selectionView.html'),
    transclude: {
      'selectionContent': 'content',
      'selectionButtons': 'buttons'
    }
  };
};
