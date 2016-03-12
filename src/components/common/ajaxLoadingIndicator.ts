export const mod = angular.module('iow.components.common');

mod.directive('ajaxLoadingIndicator', () => {
  return {
    template: Modernizr.cssanimations
      ? `${require('./ajaxLoadingIndicator.html')}`
      : `<img src="${require('./ajaxloadingindicator.svg')}" />`
  };
});
