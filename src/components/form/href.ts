import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import * as _ from 'lodash';

export const mod = angular.module('iow.components.form');

mod.directive('ngHref', () => {
  return {
    restrict: 'A',
    require: ['?^editable', '?^nonEditable'],
    link($scope: IScope, element: JQuery, attributes: HrefAttributes, controllers: any[]) {
      if (_.any(controllers, ctrl => ctrl && ctrl.external)) {
        element.attr('target', '_blank');
      }
    }
  }
});

interface HrefAttributes extends IAttributes {
  external: boolean;
}
