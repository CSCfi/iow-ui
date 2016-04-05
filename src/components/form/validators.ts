import * as moment from 'moment';
import Moment = moment.Moment;
import { DataType } from '../common/dataTypes';
const URI = require('uri-js');

export interface ValidatorWithFormat {
  (input: string): boolean;
  format?: string;
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

export const isValidIdentifier = createRegexValidator(/^[a-zA-Z][a-zA-Z0-9]*$/);

export function isValidNamespace(str: string): boolean {
  return !str || str.endsWith('#') || str.endsWith('/');
}

export function isValidUrl(url: string): boolean {
  if (!url) {
    return true;
  } else {
    const parsed = URI.parse(url);
    return !parsed.error && !!parsed.scheme && !parsed.scheme.startsWith('urn');
  }
}

export function isValidUri(uri: string): boolean {
  if (!uri) {
    return true;
  } else {
    const parsed = URI.parse(uri);
    return !parsed.error && !!parsed.scheme;
  }
}

export const isValidBoolean = createInValuesValidator('true', 'false');
export const isValidDecimal = createRegexValidator(/^[0-9]+\.?[0-9]*$/);
export const isValidNumber = createRegexValidator(/^[0-9]+$/);
export const isValidDate = createMomentValidator('YYYY-MM-DD');
export const isValidDateTime = createMomentValidator('YYYY-MM-DD H:mm:ss');
export const isValidTime = createMomentValidator('H:mm:ss');
export const isValidYear = createMomentValidator('YYYY');
export const isValidMonth = createMomentValidator('MM');
export const isValidDay = createMomentValidator('DD');

export function resolveValidator(dataType: DataType): ValidatorWithFormat {
  switch (dataType) {
    case 'xsd:string':
    case 'rdf:langString':
      return (input: string) => true;
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
      throw new Error('Unsupported data type');
  }
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

  const validator: ValidatorWithFormat = (input: string) => {
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

  const validator: ValidatorWithFormat = (input: string) => {
    return !input || regex.test(input);
  };
  validator.format = unescapedString();
  return validator;
}

function createMomentValidator(format: string) {
  const validator: ValidatorWithFormat = (input: string) => {
    return !input || moment(input, format, true).isValid();
  };
  validator.format = format;
  return validator;
}
