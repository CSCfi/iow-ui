import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import {
  isStringValid, isValidLabelLength, isValidModelLabelLength, isValidPrefix,
  isValidPrefixLength, isValidNamespace, isValidUrl
} from './validators';

export const mod = angular.module('iow.components.form');

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
          case 'prefix':
            ngModel.$validators['prefix'] = isValidPrefix;
            ngModel.$validators['length'] = isValidPrefixLength;
            break;
          case 'namespace':
            ngModel.$validators['namespace'] = isValidNamespace;
            ngModel.$validators['url'] = isValidUrl;
            break;
          default:
            throw new Error('Unsupported input type');
        }
      }
    }
  }
});
