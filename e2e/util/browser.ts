/// <reference types="protractor" />
/// <reference types="jasmine" />

export function navigateAndReturn<T>(path: string, obj: T): T {
  browser.get(path);
  return obj;
}
