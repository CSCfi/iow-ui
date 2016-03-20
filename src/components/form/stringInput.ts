import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { isStringValid, isValidLabelLength, isValidModelLabelLength } from './validators';

import { module as mod }  from './module';

interface StringInputAttributes extends IAttributes {
  stringInput: string;
}

mod.directive('stringInput', () => {
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: StringInputAttributes, ngModel: INgModelController) {
      ngModel.$validators['string'] = isStringValid;

      if (attributes.stringInput) {
        switch (attributes.stringInput) {
          case 'label':
            ngModel.$validators['length'] = isValidLabelLength;
            break;
          case 'modelLabel':
            ngModel.$validators['length'] = isValidModelLabelLength;
            break;
          default:
            throw new Error('Unsupported input type');
        }
      }
    }
  };
});
