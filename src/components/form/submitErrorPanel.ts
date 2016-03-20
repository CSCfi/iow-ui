import { module as mod }  from './module';

mod.directive('submitErrorPanel', () => {
  return {
    restrict: 'E',
    template: require('./submitErrorPanel.html'),
    scope: {
      error: '='
    }
  };
});
