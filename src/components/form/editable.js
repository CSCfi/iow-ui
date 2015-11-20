module.exports = function editableDirective() {
  'ngInject';
  return {
    scope: {
      title: '@',
      link: '=',
      externalLink: '=',
      valueAsLocalizationKey: '@'
    },
    restrict: 'E',
    template: require('./editable.html'),
    require: '?^form',
    transclude: true,
    link($scope, element, attributes, formController) {
      $scope.formController = formController;
      $scope.ngModel = element.find('[ng-model]').controller('ngModel');
    },
    controller($scope, $location, languageService, gettextCatalog) {
      'ngInject';

      $scope.isDifferentUrl = url => {
        return $location.url().replace(/:/g, '%3A') !== url;
      };
      $scope.displayValue = () => {
        const value = $scope.ngModel && $scope.ngModel.$modelValue;
        if (value) {
          return typeof value === 'object' ? languageService.translate(value) : $scope.valueAsLocalizationKey ? gettextCatalog.getString(value) : value;
        }
      };
    }
  };
};
