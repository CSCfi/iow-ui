import { IAttributes, INgModelController, IScope } from 'angular';
import * as _ from 'lodash';
import { Uri } from '../../services/uri';
import { contains, containsAny } from '../../utils/array';
import { referenceEquality } from '../../utils/object';
import { module as mod }  from './module';

interface RestrictDuplicatesAttributes extends IAttributes {
  restrictDuplicates: string;
}

mod.directive('restrictDuplicates', () => {
  return {
    restrict: 'A',
    require: ['restrictDuplicates', 'ngModel'],
    link($scope: IScope, _element: JQuery, attributes: RestrictDuplicatesAttributes, [thisController, ngModel]: [RestrictDuplicatesController, INgModelController]) {

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
          return !thisController.duplicateCheckingFunction(value);
        } else {
          const valuesToCheckAgainst = thisController.valuesToCheckAgainst;

          if (!valuesToCheckAgainst) {
            return true;
          }

          if ('localizedInput' in attributes) {
            const inputLocalizations = Object.values(value);
            const valuesToCheckAgainstLocalizations = _.flatten(_.map(valuesToCheckAgainst, v => Object.values(v)));
            return !containsAny(valuesToCheckAgainstLocalizations, inputLocalizations);
          } else {
            const equals = value instanceof Uri ? (lhs: Uri, rhs: Uri) => lhs.equals(rhs) : referenceEquality;
            return !contains(valuesToCheckAgainst, value, equals);
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
