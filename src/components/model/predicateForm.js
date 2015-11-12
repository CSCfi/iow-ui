module.exports = function predicateForm() {
  'ngInject';
  return {
    scope: {
      predicate: '=',
      references: '='
    },
    restrict: 'E',
    template: require('./predicateForm.html')
  };
};
