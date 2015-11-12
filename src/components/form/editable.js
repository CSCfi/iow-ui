module.exports = function editableDirective() {
  'ngInject';
  return {
    scope: {
      title: '@',
      titleEditOnly: '@',
      valueAsLocalizationKey: '@'
    },
    restrict: 'E',
    template: require('./editable.html'),
    require: '^form',
    transclude: true,
    link($scope, element, attributes, formController) {
      $scope.formController = formController;
      $scope.ngModel = element.find('[ng-model]').controller('ngModel');
    },
    controller($scope, languageService, gettextCatalog) {
      'ngInject';

      $scope.displayValue = () => {
        const value = $scope.ngModel && $scope.ngModel.$modelValue;
        return typeof value === 'object' ? languageService.translate(value) : $scope.valueAsLocalizationKey ? gettextCatalog.getString(value) : value;
      };
    }
  };
};
