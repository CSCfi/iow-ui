import { config, dateFormat } from '../config';
import { module as mod }  from './module';
import moment = require('moment');

mod.directive('footer', () => {
  return {
    restrict: 'E',
    template: require('./footer.html'),
    controllerAs: 'ctrl',
    controller: FooterController
  };
});

class FooterController {
  gitHash = config.gitHash;
  gitDate = moment(config.gitDate, dateFormat);
}
