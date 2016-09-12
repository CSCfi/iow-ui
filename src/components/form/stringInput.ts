import { IAttributes, INgModelController, IScope } from 'angular';
import { isValidString, isValidLabelLength, isValidModelLabelLength, isValidIdentifier } from './validators';
import { module as mod }  from './module';

interface StringInputAttributes extends IAttributes {
  stringInput: string;
}

mod.directive('stringInput', () => {
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: StringInputAttributes, ngModel: INgModelController) {
      ngModel.$validators['string'] = isValidString;

      if (attributes.stringInput) {
        switch (attributes.stringInput) {
          case 'label':
            ngModel.$validators['length'] = isValidLabelLength;
            break;
          case 'modelLabel':
            ngModel.$validators['length'] = isValidModelLabelLength;
            break;
          case 'identifier':
            ngModel.$validators['id'] = isValidIdentifier;
            break;
          default:
            throw new Error('Unsupported input type');
        }
      }
    }
  };
});
