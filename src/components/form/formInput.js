module.exports = function formInputDirective() {
  'ngInject';
  return {
    scope: {
      ngModel: '=',
      title: '@',
      localized: '@',
      titleEditOnly: '@'
    },
    restrict: 'E',
    template: require('./formInput.html'),
    require: '^form',
    link($scope, element, attributes, formController) {
      $scope.formController = formController;
    },
    controller($scope, languageService) {
      'ngInject';
      $scope.hasContent = () => $scope.localized ? languageService.translate($scope.ngModel) : $scope.ngModel;
    }
  };
};
