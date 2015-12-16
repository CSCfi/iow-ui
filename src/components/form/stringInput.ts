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

export function isValidLabelLength(label: string): boolean {
  return !label || label.length <= 40;
}

export function isValidModelLabelLength(label: string): boolean {
  return !label || label.length <= 60;
}

export function isValidPrefixLength(prefix: string): boolean {
  return !prefix || prefix.length <= 8;
}

export function isValidPrefix(prefix: string): boolean {
  return !prefix || !!prefix.match(/^[a-z]+$/);
}

export function isValidNamespace(str: string): boolean {
  return !str || str.endsWith('#') || str.endsWith('/');
}

const URL_REGEXP = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;

export function isValidUrl(url: string): boolean {
  return !url || URL_REGEXP.test(url);
}

interface StringInputAttributes extends IAttributes {
  stringInput: string;
}

mod.directive('stringInput', () => {
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: StringInputAttributes, ngModel: INgModelController) {
      ngModel.$validators['string'] = isStringValid;

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
      }
    }
  }
});
