const _ = require('lodash');

module.exports = function directive($timeout) {
  'ngInject';

  function normalizeAsArray(obj) {
    return (Array.isArray(obj) ? obj : [obj]) || [];
  }

  function disableModelChangeEvents(ngModel) {
    const disableEvents = {
      updateOn: ''
    };

    if (ngModel.$options) {
      _.assign(ngModel.$options, disableEvents);
    } else {
      ngModel.$options = disableEvents;
    }
  }

  function focus(element) {
    $timeout(() => {
      $timeout(() => {
        element.focus();
      });
    });
  }

  function elementValue(event) {
    return angular.element(event.target).val();
  }

  function single(obj) {
    const array = normalizeAsArray(obj);
    return array.length === 1 ? array[0] : null;
  }

  return {
    scope: {
      options: '=',
      datasets: '='
    },
    restrict: 'A',
    require: '?ngModel',
    link($scope, element, attributes, ngModel) {
      const options = $scope.options || {};

      let initialized = false;

      // FIXME: hack, fixes bug in typeahead.js
      if (attributes.autofocus) {
        focus(element);
      }

      $scope.$watch('datasets', datasets => {
        if (datasets) {
          if (initialized) {
            destroy();
          }
          initialize(normalizeAsArray(datasets));
        }
      });

      $scope.$on('$destroy', () => {
        if (initialized) {
          destroy();
        }
      });

      function isNotEditable() {
        return options.editable === false;
      }

      function updateModel(event, suggestion) {
        $scope.$apply(() => {
          if (isNotEditable()) {
            ngModel.$setViewValue(suggestion);
          } else {
            ngModel.$setViewValue(elementValue(event));
          }
          ngModel.$commitViewValue();
        });
      }

      function initialize(datasets) {
        element.typeahead(options, datasets);

        if (ngModel) {
          element.bind('typeahead:selected', updateModel);
          element.bind('typeahead:autocompleted', updateModel);

          if (isNotEditable()) {
            disableModelChangeEvents(ngModel);

            element.bind('typeahead:render', (event, suggestions) => {
              updateModel(event, single(suggestions));
            });
            element.bind('keyup', (event) => {
              if (elementValue(event) < options.minLength) {
                updateModel(event, null);
              }
            });
          }
        }

        initialized = true;
      }

      function destroy() {
        element.unbind('keyup');
        element.typeahead('destroy');
        initialized = false;
      }
    }
  };
};
