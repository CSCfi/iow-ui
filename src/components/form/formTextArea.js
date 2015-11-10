module.exports = function formTextAreaDirective() {
  'ngInject';
  return {
    scope: {
      ngModel: '=',
      title: '@'
    },
    restrict: 'E',
    template: require('./formTextArea.html'),
    require: '^form',
    link($scope, element, attributes, formController) {
      $scope.formController = formController;
    },
    controller($scope, languageService) {
      'ngInject';
      $scope.hasContent = () => languageService.translate($scope.ngModel);
    }
  };
};
