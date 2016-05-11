import * as moment from 'moment';
import Moment = moment.Moment;
import { DataType } from '../../services/dataTypes';
import { Uri } from '../../services/uri';
import { availableLanguages } from '../../utils/language';
const URI = require('uri-js');

export interface Validator<T> {
  (input: T, raw?: any): boolean;
}

export interface ValidatorWithFormat<T> extends Validator<T> {
  format?: string;
}

export function arrayValidator<T>(validator: Validator<T>) {
  return (input: T[]) => {
    if (input) {
      for (const value of input) {
        if (!validator(value)) {
          return false;
        }
      }
    }
    return true;
  };
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

export const isValidPrefix = createRegexValidator(/^[a-z][a-z0-9]*$/);
export const isValidIdentifier = createRegexValidator(/^[a-zA-Z][a-zA-Z0-9]*$/);

export function isValidNamespace(str: string|Uri): boolean {
  return !str || str.toString().endsWith('#') || str.toString().endsWith('/');
}

export function isValidUrl(url: string|Uri): boolean {
  if (!url) {
    return true;
  } else {
    const parsed = URI.parse(url.toString());
    return !parsed.error && !!parsed.scheme && !!parsed.host && !parsed.scheme.startsWith('urn');
  }
}

export function isValidUri(uri: string|Uri): boolean {
  if (!uri) {
    return true;
  } else {
    const parsed = URI.parse(uri.toString());
    return !parsed.error && !!parsed.scheme;
  }
}

export function isValidLanguageCode(code: string): boolean {
  if (!code) {
    return true;
  } else {
    for (const language of availableLanguages) {
      if (language === code) {
        return true;
      }
    }
    return false;
  }
}

export const isValidString = createNopValidator();
export const isValidBoolean = createInValuesValidator('true', 'false');
export const isValidDecimal = createRegexValidator(/^[0-9]+\.?[0-9]*$/);
export const isValidNumber = createRegexValidator(/^[0-9]+$/);
export const isValidDate = createMomentValidator('YYYY-MM-DD');
export const isValidDateTime = createMomentValidator('YYYY-MM-DD H:mm:ss');
export const isValidTime = createMomentValidator('H:mm:ss');
export const isValidYear = createMomentValidator('YYYY');
export const isValidMonth = createMomentValidator('MM');
export const isValidDay = createMomentValidator('DD');

export function resolveValidator(dataType: DataType): ValidatorWithFormat<string> {
  switch (dataType) {
    case 'xsd:string':
    case 'rdf:langString':
    case 'rdfs:Literal':
      return isValidString;
    case 'xsd:anyURI':
      return isValidUri;
    case 'xsd:boolean':
      return isValidBoolean;
    case 'xsd:decimal':
    case 'xsd:double':
    case 'xsd:float':
      return isValidDecimal;
    case 'xsd:integer':
    case 'xsd:long':
    case 'xsd:int':
      return isValidNumber;
    case 'xsd:date':
      return isValidDate;
    case 'xsd:dateTime':
      return isValidDateTime;
    case 'xsd:time':
      return isValidTime;
    case 'xsd:gYear':
      return isValidYear;
    case 'xsd:gMonth':
      return isValidMonth;
    case 'xsd:gDay':
      return isValidDay;
    default:
      console.log('No validator for unknown data type: ' + dataType);
      return createNopValidator();
  }
}

function createNopValidator<T>(format?: string) {
  const validator: ValidatorWithFormat<T> = (input: T) => true;
  validator.format = format;
  return validator;
}

function createInValuesValidator(...values: string[]) {

  function inValues(input: string) {
    for (const value of values) {
      if (input === value) {
        return true;
      }
    }
    return false;
  }

  const validator: ValidatorWithFormat<string> = (input: string) => {
    return !input || inValues(input);
  };
  validator.format = values.join('/');
  return validator;
}

function createRegexValidator(regex: RegExp) {

  function unescapedString() {
    const regexStr = regex.toString();
    return regexStr.substr(1, regexStr.length - 2).replace('^', '').replace('$', '');
  }

  const validator: ValidatorWithFormat<string> = (input: string) => {
    return !input || regex.test(input);
  };
  validator.format = unescapedString();
  return validator;
}

function createMomentValidator(format: string) {
  const validator: ValidatorWithFormat<string> = (input: string) => {
    return !input || moment(input, format, true).isValid();
  };
  validator.format = format;
  return validator;
}
