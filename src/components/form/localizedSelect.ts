import gettextCatalog = angular.gettext.gettextCatalog;
import IScope = angular.IScope;
import * as _ from 'lodash';

export const mod = angular.module('iow.components.form');

mod.directive('localizedSelect', () => {
  'ngInject';
  return {
    scope: {
      value: '=',
      values: '=',
      id: '@'
    },
    restrict: 'E',
    template: `<select id="{{ctrl.id}}" class="form-control" required ng-model="ctrl.value" 
                       ng-options="value.value as value.localization for value in ctrl.localizedValues">
               </select>`,
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope: IScope, gettextCatalog: gettextCatalog) {
      'ngInject';

      function localize(text: string) {
        return {localization: text && `${gettextCatalog.getString(text)} (${text})`, value: text};
      }

      $scope.$watch(() => this.values, values => this.localizedValues = _.map(values, localize));
    }
  };
});
