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
