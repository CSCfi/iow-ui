module.exports = function classForm() {
  'ngInject';
  return {
    scope: {
      class: '=',
      references: '=',
      editableController: '='
    },
    restrict: 'E',
    template: require('./classForm.html')
  };
};
