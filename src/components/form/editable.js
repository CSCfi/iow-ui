const _ = require('lodash');

module.exports = function editableDirective() {
  'ngInject';
  return {
    scope: {
      title: '@',
      titleEditOnly: '@'
    },
    restrict: 'E',
    template: require('./editable.html'),
    require: '^form',
    transclude: true,
    link($scope, element, attributes, formController) {
      $scope.formController = formController;
      $scope.ngModel = element.find('[ng-model]').controller('ngModel');
    },
    controller($scope, languageService) {
      'ngInject';

      $scope.displayValue = () => {
        const value = $scope.ngModel && $scope.ngModel.$modelValue;
        return typeof value === 'object' ? languageService.translate(value) : value;
      };
    }
  };
};
