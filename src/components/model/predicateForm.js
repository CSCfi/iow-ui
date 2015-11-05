module.exports = function predicateForm() {
  'ngInject';
  return {
    scope: {
      predicate: '='
    },
    restrict: 'E',
    template: require('./predicateForm.html')
  };
};
