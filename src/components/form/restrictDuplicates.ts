import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { Uri } from '../../services/uri';

import { module as mod }  from './module';

interface RestrictDupicatesAttributes extends IAttributes {
  restrictDuplicates: string;
}

mod.directive('restrictDuplicates', () => {
  return {
    restrict: 'A',
    require: ['restrictDuplicates', 'ngModel'],
    link($scope: IScope, element: JQuery, attributes: RestrictDupicatesAttributes, [thisController, ngModel]: [RestrictDuplicatesController, INgModelController]) {

      $scope.$watchCollection(attributes.restrictDuplicates, (values: any[]) => {
        thisController.valuesToCheckAgainst = values;
      });

      ngModel.$validators['duplicate'] = value => {
        const valuesToCheckAgainst = thisController.valuesToCheckAgainst;

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
