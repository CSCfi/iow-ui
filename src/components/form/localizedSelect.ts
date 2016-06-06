import gettextCatalog = angular.gettext.gettextCatalog;
import IScope = angular.IScope;
import { module as mod }  from './module';

mod.directive('localizedSelect', () => {
  return {
    scope: {
      value: '=',
      values: '=',
      id: '@'
    },
    restrict: 'E',
    template: `
      <iow-select id="{{ctrl.id}}" required ng-model="ctrl.value" options="value in ctrl.values">
        <span>{{value | translate}}</span>
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
}
