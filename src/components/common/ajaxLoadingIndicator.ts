export const mod = angular.module('iow.components.common');

mod.directive('ajaxLoadingIndicator', () => {
  return {
    template: require('./ajaxLoadingIndicator.html')
  };
});
