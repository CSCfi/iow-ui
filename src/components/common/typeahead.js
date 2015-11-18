const _ = require('lodash');
const utils = require('../../services/utils');

module.exports = function directive($timeout, $q, $log) {
  'ngInject';

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
    const array = utils.normalizeAsArray(obj);
    return array.length === 1 ? array[0] : null;
  }

  return {
    scope: {
      options: '=',
      datasets: '=',
      selectionMapper: '='
    },
    restrict: 'A',
    require: '?ngModel',
    link($scope, element, attributes, ngModel) {
      const options = $scope.options || {};
      const selectionMapper = $scope.selectionMapper || $q.when;

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
          initialize(utils.normalizeAsArray(datasets));
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
          $q.when(selectionMapper(isNotEditable() ? suggestion : elementValue(event)))
            .then(mapped => {
              ngModel.$setViewValue(mapped);
              ngModel.$commitViewValue();
            },
            err => $log.error(err));
        });
      }

      function initialize(datasets) {
        element.typeahead(options, datasets);

        if (ngModel) {
          element.bind('typeahead:selected', updateModel);
          element.bind('typeahead:autocompleted', updateModel);

          if (isNotEditable()) {
            disableModelChangeEvents(ngModel);

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
