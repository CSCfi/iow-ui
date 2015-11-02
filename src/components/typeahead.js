module.exports = function directive($timeout) {
  'ngInject';
  return {
    scope: {
      options: '=',
      datasets: '='
    },
    restrict: 'A',
    require: '?ngModel',
    link($scope, element, attributes, ngModel) {
      const options = $scope.options || {};
      const datasets = (Array.isArray($scope.datasets) ? $scope.datasets : [$scope.datasets]) || [];

      element.typeahead(options, datasets);

      // FIXME: hack, fixes bug in typeahead.js
      if (attributes.autofocus) {
        $timeout(() => {
          $timeout(() => {
            element.focus();
          });
        });
      }

      ngModel.$parsers.push((viewValue) => {
        if (options.editable === false) {
          if (ngModel) {
            ngModel.$setValidity('notSelected', viewValue.selected);
          }
          return viewValue.selected ? viewValue.value : undefined;
        } else {
          return viewValue;
        }
      });

      ngModel.$formatters.push((modelValue) => {
        return modelValue;
      });

      function updateModel(event, suggestion) {
        if (ngModel) {
          $scope.$apply(() => {
            if (options.editable === false) {
              ngModel.$setViewValue({selected: true, value: suggestion});
            } else {
              ngModel.$setViewValue(angular.element(event.target).val());
            }
          });
        }
      }

      element.bind('typeahead:selected', updateModel);
      element.bind('typeahead:autocompleted', updateModel);
      element.bind('typeahead:change', (event) => {
        if (options.editable === false && ngModel && !ngModel.$modelValue) {
          angular.element(event.target).val(null);
        }
      });
      $scope.$on('$destroy', () => element.typeahead('destroy'));
    }
  };
};
