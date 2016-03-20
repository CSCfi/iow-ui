import { config } from '../config';
import { module as mod }  from './module';

mod.directive('footer', () => {
  return {
    restrict: 'E',
    template: require('./footer.html'),
    controllerAs: 'ctrl',
    controller() {
      this.gitHash = config.gitHash;
      this.gitDate = config.gitDate;
    }
  };
});
