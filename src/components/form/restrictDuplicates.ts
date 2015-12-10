import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;

export const mod = angular.module('iow.components.form');

interface RestrictDupicatesAttributes extends IAttributes {
  restrictDuplicates: string;
}

mod.directive('restrictDuplicates', () => {
  'ngInject';
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: RestrictDupicatesAttributes, ngModel: INgModelController) {
      let valuesToCheckAgainst: any[] = [];
      $scope.$watch(attributes.restrictDuplicates, (values: any[]) => valuesToCheckAgainst = values);

      ngModel.$validators['duplicate'] = value => {
        return !valuesToCheckAgainst || valuesToCheckAgainst.indexOf(value) === -1;
      };
    }
  };
});
