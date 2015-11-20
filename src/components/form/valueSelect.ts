import gettextCatalog = angular.gettext.gettextCatalog;

export const mod = angular.module('iow.components.form');

mod.directive('valueSelect', () => {
  'ngInject';
  return {
    scope: {
      value: '=',
      values: '=',
      name: '@'
    },
    restrict: 'E',
    template: `<select name="{{ctrl.name}}" class="form-control" ng-model="ctrl.value">
                 <option ng-repeat="value in ctrl.values" value="{{value}}">{{ctrl.displayName(value)}}</option>
               </select>`,
    controllerAs: 'ctrl',
    bindToController: true,
    controller(gettextCatalog: gettextCatalog) {
      'ngInject';
      this.displayName = (text: string) => text && `${gettextCatalog.getString(text)} (${text})`;
    }
  };
});
