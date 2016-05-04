import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';

interface RestrictDuplicatesAttributes extends IAttributes {
  restrictDuplicates: string;
}

mod.directive('restrictDuplicates', () => {
  return {
    restrict: 'A',
    require: ['restrictDuplicates', 'ngModel'],
    link($scope: IScope, element: JQuery, attributes: RestrictDuplicatesAttributes, [thisController, ngModel]: [RestrictDuplicatesController, INgModelController]) {

      const restrictDuplicatesValue = $scope.$eval(attributes.restrictDuplicates);

      if (typeof $scope.$eval(attributes.restrictDuplicates) === 'function') {
        thisController.duplicateCheckingFunction = restrictDuplicatesValue;
      } else {
        $scope.$watchCollection(attributes.restrictDuplicates, (values: any[]) => {
          thisController.valuesToCheckAgainst = values;
        });
      }

      ngModel.$validators['duplicate'] = value => {

        if (!!thisController.duplicateCheckingFunction) {
          return thisController.duplicateCheckingFunction(value);
        } else {
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

        }
      };
    },
    controller: RestrictDuplicatesController
  };
});


class RestrictDuplicatesController {
  duplicateCheckingFunction: (item: any) => boolean;
  valuesToCheckAgainst: any[] = [];
}
