import Dataset = Twitter.Typeahead.Dataset;
import Options = Twitter.Typeahead.Options;
import IAttributes = angular.IAttributes;
import ILogService = angular.ILogService;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import * as _ from 'lodash';
import { normalizeAsArray } from '../../services/utils';

export const mod = angular.module('iow.components.common');

mod.directive('iowTypeahead', ($timeout: ITimeoutService, $q: IQService, $log: ILogService) => {
  /* @ngInject */

  function disableModelChangeEvents(ngModel: INgModelController) {
    const disableEvents = {
      updateOn: ''
    };

    if (ngModel.$options) {
      _.assign(ngModel.$options, disableEvents);
    } else {
      ngModel.$options = disableEvents;
    }
  }

  function focus(element: TypeaheadElement) {
    $timeout(() => {
      $timeout(() => {
        element.focus();
      });
    });
  }

  function elementValue(event: JQueryEventObject) {
    return angular.element(event.target).val();
  }

  return {
    scope: {
      options: '=',
      datasets: '=',
      selectionMapper: '='
    },
    restrict: 'A',
    require: '?ngModel',
    link($scope: TypeaheadScope, element: TypeaheadElement, attributes: TypeaheadAttribute, ngModel: INgModelController) {
      const options: TypeaheadOptions = $scope.options || {};
      const selectionMapper = $scope.selectionMapper || $q.when;

      let initialized = false;

      // FIXME: hack, fixes bug in typeahead.js
      if (attributes.autofocus) {
        focus(element);
      }

      $scope.$watch('datasets', (datasets: Dataset|Dataset[]) => {
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

      function updateModel(event: any, suggestion: any) {
        $scope.$apply(() => {
          $q.when(selectionMapper(isNotEditable() ? suggestion : elementValue(event)))
            .then(mapped => {
              ngModel.$setViewValue(mapped);
              ngModel.$commitViewValue();
            },
            err => $log.error(err));
        });
      }

      function initialize(datasets: Dataset[]) {
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
});

interface TypeaheadOptions extends Options {
  editable?: boolean;
}

interface TypeaheadScope extends IScope {
  options: TypeaheadOptions;
  datasets: Dataset|Dataset[];
  selectionMapper: (selection: any) => IPromise<any>
}

interface TypeaheadAttribute extends IAttributes {
  autofocus: boolean
}

interface TypeaheadElement {
  bind(eventType: string, handler: (eventObject: JQueryEventObject, suggestion: any) => any): JQuery;
  unbind(evt: any): JQuery;
  focus(): JQuery;
  typeahead(methodName: 'destroy'): JQuery;
  typeahead(options: Twitter.Typeahead.Options, datasets: Twitter.Typeahead.Dataset[]): JQuery;
}
