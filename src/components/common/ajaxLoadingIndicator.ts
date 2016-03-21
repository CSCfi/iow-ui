import { module as mod }  from './module';

mod.directive('ajaxLoadingIndicator', () => {
  return {
    template: Modernizr.cssanimations
      ? require('./ajaxLoadingIndicator.html')
      : `<img src="${require('../../assets/ajaxLoadingIndicator.svg')}" />`
  };
});
