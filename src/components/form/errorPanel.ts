import { module as mod }  from './module';

mod.directive('errorPanel', () => {
  return {
    restrict: 'E',
    template: require('./errorPanel.html'),
    scope: {
      error: '='
    }
  };
});
