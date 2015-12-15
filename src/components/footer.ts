import { config } from '../config';

const mod = angular.module('iow.components');

mod.directive('footer', () => {
  return {
    restrict: 'E',
    template: require('./footer.html'),
    controllerAs: 'ctrl',
    controller() {
      this.gitHash = config.gitHash;
      this.gitDate = config.gitDate;
    }
  }
});
