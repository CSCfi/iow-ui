import { module as mod }  from './module';

mod.directive('ajaxLoadingIndicatorSmall', () => {
  return {
    template: `<img src="${require('../../assets/ajaxloadingindicatorSmall.gif')}" />`
  };
});
