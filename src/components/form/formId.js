module.exports = function idInputDirective() {
  'ngInject';
  return {
    scope: {
      ngModel: '=',
      title: '@'
    },
    restrict: 'E',
    template: require('./formId.html'),
    require: '^form',
    link($scope, element, attributes, formController) {
      $scope.formController = formController;
    }
  };
};
