import { INgModelController } from 'angular';
import { upperCaseFirst, lowerCaseFirst } from 'change-case';
import { any, contains, keepMatching } from '../utils/array';
import { Property } from '../entities/class';
import { createScrollWithDefault } from './contract';
import { config } from '../../config';

export const editableMargin = { left: 20, right: 20 };
export const editableMarginInColumn = Object.assign({}, editableMargin, { bottom: 15 });
export const editableSelectMargin =  Object.assign({}, editableMargin, { bottom: 15 });
export const editableMultipleMargin = Object.assign({}, editableMargin, { bottom: 15 });

export function getModalController<T>(controllerName = 'ctrl') {
  return (angular.element('.modal').scope() as any)[controllerName] as T;
}

function inputWithNgModel(element: () => JQuery, validate: (ngModel: INgModelController) => boolean) {
  return () => {
    const e = element();
    const ngModel: INgModelController = e.controller('ng-model');

    if (!ngModel) {
      console.log(e);
      throw new Error('No ng-model for element');
    }

    return validate(ngModel);
  };
}

export function validInput(element: () => JQuery) {
  return inputWithNgModel(element, ngModel => ngModel.$valid && !ngModel.$pending);
}

export function inputHasExactValue(element: () => JQuery, value: string) {
  return inputWithNgModel(element, ngModel => ngModel.$viewValue === value);
}

export function expectAll(...expectations: (() => boolean)[]): () => boolean {
  return () => {
    for (const expectation of expectations) {
      if (!expectation()) {
        return false;
      }
    }
    return true;
  };
}

export function elementExists(element: () => JQuery) {
  return () => {
    const e = element();
    return e && e.length > 0;
  };
}

export function initialInputValue(element: () => JQuery, value: string) {
  return () => {
    const initialInputNgModel = element().controller('ngModel');

    if (!initialInputNgModel) {
      throw new Error('ng-model does not exits for initial input');
    } else {
      initialInputNgModel.$setViewValue(value);
      initialInputNgModel.$render();
    }
  };
}

export const scrollToTop = createScrollWithDefault(() => angular.element('body'));

export function modelIdFromPrefix(modelPrefix: string) {
  return config.defaultModelNamespace(modelPrefix);
}

function normalizeAsId(resourceName: string) {
  return resourceName
    .replace(/\s/g, '')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ä/g, 'a')
    .replace(/Ä/g, 'A')
    .replace(/å/g, 'a')
    .replace(/Å/g, 'A');
}

export function classNameToResourceIdName(className: string) {
  return normalizeAsId(upperCaseFirst(className));
}

export function predicateNameToResourceIdName(predicateName: string) {
  return normalizeAsId(lowerCaseFirst(predicateName));
}

export function classIdFromNamespaceId(namespaceId: string, name: string) {
  return namespaceId + '#' + classNameToResourceIdName(name);
}

export function predicateIdFromNamespaceId(namespaceId: string, name: string) {
  return namespaceId + '#' + predicateNameToResourceIdName(name);
}

// XXX: api returns interesting {uuid}-{uuid} for which only first ui is stabile
export const propertyIdIsSame = (l: string, r: string) => l.indexOf(r) !== -1 || r.indexOf(l) !== -1;

export const isExpectedProperty = (expectedProperties: string[]) =>
  (property: Property) => any(expectedProperties, uuid => propertyIdIsSame(uuid, property.internalId.uuid));

export function onlyProperties(properties: Property[], expectedProperties: string[]) {
  keepMatching(properties, isExpectedProperty(expectedProperties));
}

export function moveCursorToEnd(input: JQuery) {
  if (contains(['INPUT', 'TEXTAREA'], input.prop('tagName'))) {
    const valueLength = input.val().length;
    // ensures that cursor will be at the end of the input
    if (!contains(['checkbox', 'radio'], input.attr('type'))) {
      setTimeout(() => (input[0] as HTMLInputElement).setSelectionRange(valueLength, valueLength));
    }
  }
}
