module.exports = function classForm() {
  'ngInject';
  return {
    scope: {
      class: '=',
      context: '='
    },
    restrict: 'E',
    template: require('./templates/classForm.html')
  };
};
