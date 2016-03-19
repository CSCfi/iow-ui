export const mod = angular.module('iow.components.common');

mod.directive('ajaxLoadingIndicatorSmall', () => {
  return {
    template: `<img src="${require('../../assets/ajaxloadingindicatorSmall.gif')}" />`
  };
});
