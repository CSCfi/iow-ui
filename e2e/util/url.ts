/// <reference types="protractor" />
/// <reference types="jasmine" />

export const applicationUrl = 'http://localhost:9001';

export function expectCurrentUrlToEqualPath(path: string) {
  expect(browser.getCurrentUrl().then(decodeURIComponent)).toEqual(decodeURIComponent(applicationUrl + path));
}
