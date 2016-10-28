import { INgModelController } from 'angular';
import { upperCaseFirst, lowerCaseFirst } from 'change-case';
import { any, removeMatching } from '../utils/array';
import { Property } from '../entities/class';

export const editableMargin = { left: 20, right: 20 };
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

export function modelIdFromPrefix(modelPrefix: string) {
  return `http://iow.csc.fi/ns/${modelPrefix}`;
}

export function classIdFromPrefixAndName(modelPrefix: string, name: string) {
  return modelIdFromPrefix(modelPrefix) + '#' + upperCaseFirst(name);
}

export function predicateIdFromPrefixAndName(modelPrefix: string, name: string) {
  return modelIdFromPrefix(modelPrefix) + '#' + lowerCaseFirst(name);
}

// XXX: api returns interesting {uuid}-{uuid} for which only first ui is stabile
export const propertyIdIsSame = (l: string, r: string) => l.indexOf(r) !== -1 || r.indexOf(l) !== -1;

export function onlyProperties(properties: Property[], expectedProperties: string[]) {
  removeMatching(properties, property => !any(expectedProperties, uuid => propertyIdIsSame(uuid, property.internalId.uuid)));
}
