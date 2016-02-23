import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { Uri } from '../../services/uri';

export const mod = angular.module('iow.components.form');

interface RestrictDupicatesAttributes extends IAttributes {
  restrictDuplicates: string;
}

mod.directive('restrictDuplicates', () => {
  return {
    restrict: 'A',
    require: ['restrictDuplicates', 'ngModel'],
    link($scope: IScope, element: JQuery, attributes: RestrictDupicatesAttributes, controllers: [RestrictDuplicatesController, INgModelController]) {
      const restrictDuplicatesController = controllers[0];
      const ngModel = controllers[1];

      $scope.$watch(attributes.restrictDuplicates, (values: any[]) => {
        restrictDuplicatesController.valuesToCheckAgainst = values;
      });

      ngModel.$validators['duplicate'] = value => {
        const valuesToCheckAgainst = restrictDuplicatesController.valuesToCheckAgainst;

        if (!valuesToCheckAgainst) {
          return true;
        }

        if ('localizedInput' in attributes) {
          return _.intersection(Object.values(value), _.flatten(_.map(valuesToCheckAgainst, v => Object.values(v)))).length === 0;
        } else {
          if (value instanceof Uri) {
            return !_.find(valuesToCheckAgainst, valueToCheckAgainst => valueToCheckAgainst.equals(value));
          } else {
            return valuesToCheckAgainst.indexOf(value) === -1;
          }
        }
      };
    },
    controller: RestrictDuplicatesController
  };
});


class RestrictDuplicatesController {
  valuesToCheckAgainst: any[] = [];
}
