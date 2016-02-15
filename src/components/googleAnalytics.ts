const mod = angular.module('iow.components');

mod.directive('googleAnalytics', () => {
  return {
    restrict: 'E',
    template: require('./googleAnalytics.html')
  }
});
