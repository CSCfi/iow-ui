import gettextCatalog = angular.gettext.gettextCatalog;
import IScope = angular.IScope;
import { module as mod }  from './module';

mod.directive('localizedSelect', () => {
  return {
    scope: {
      value: '=',
      values: '=',
      id: '@',
      displayNameFormatter: '='
    },
    restrict: 'E',
    template: `
      <iow-select id="{{ctrl.id}}" required ng-model="ctrl.value" options="value in ctrl.values">
        <span>{{ctrl.getName(value)}}</span>
      </iow-select>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    controller: LocalizedSelectController
  };
});

class LocalizedSelectController {
  value: string;
  values: string[];
  id: string;
  displayNameFormatter: (value: string, gettextCatalog: gettextCatalog) => string;

  constructor(private gettextCatalog: gettextCatalog) {
  }

  getName(value: string) {
    if (this.displayNameFormatter) {
      return this.displayNameFormatter(value, this.gettextCatalog);
    } else {
      return this.gettextCatalog.getString(value);
    }
  }
}
