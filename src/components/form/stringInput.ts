import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { Localizable } from '../../services/entities';
import { LanguageService } from '../../services/languageService';

export const mod = angular.module('iow.components.form');

interface LocalizedInputAttributes extends IAttributes {
  localizedInput: string;
}

export function isStringValid(value: string): boolean {
  return !value || !!value.match(/^[a-zåäö]/i);
}

mod.directive('stringInput', () => {
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: IAttributes, ngModel: INgModelController) {
      ngModel.$validators['string'] = isStringValid;
    }
  }
});
