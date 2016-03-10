import * as moment from 'moment';
import Moment = moment.Moment;
const URI = require('uri-js');

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

function inValues(input: string, ...values: string[]) {
  for (const value of values) {
    if (input === value) {
      return true;
    }
  }
  return false;
}

export const decimalRegex = /^\d+\.?\d*$/;
export const numberRegex = /^\d+$/;
export const dateFormat = 'YYYY-MM-DD';
export const timeFormat = 'HH:mm:ss';
export const dateTimeFormat = 'YYYY-MM-DD H:mm:ss';
export const yearFormat = 'YYYY';
export const monthFormat = 'MM';
export const dayFormat = 'DD';

export function isValidBoolean(input: string) {
  return !input || inValues('true', 'false');
}

export function isValidDecimal(input: string) {
  return !input || decimalRegex.test(input);
}

export function isValidNumber(input: string) {
  return !input || numberRegex.test(input);
}

export function isValidDate(input: string) {
  return !input || moment(input, dateFormat, true).isValid();
}

export function isValidDateTime(input: string) {
  return !input || moment(input, dateTimeFormat, true).isValid()
}

export function isValidTime(input: string) {
  return !input || moment(input, timeFormat, true).isValid()
}

export function isValidYear(input: string) {
  return !input || moment(input, yearFormat, true).isValid()
}

export function isValidMonth(input: string) {
  return !input || moment(input, monthFormat, true).isValid()
}

export function isValidDay(input: string) {
  return !input || moment(input, dayFormat, true).isValid()
}
