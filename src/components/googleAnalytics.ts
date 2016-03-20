import { module as mod }  from './module';

mod.directive('googleAnalytics', () => {
  return {
    restrict: 'E',
    template: require('./googleAnalytics.html')
  };
});
