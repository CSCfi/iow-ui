
const mod = angular.module('iow.components');

mod.directive('footer', () => {
  return {
    restrict: 'E',
    template: require('./footer.html')
  }
});
