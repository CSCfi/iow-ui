import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import ILogService = angular.ILogService;
import { Class, Model, Predicate } from '../../services/entities';
import { Show } from '../contracts';

import { module as mod }  from './module';

mod.directive('visualizationView', () => {
  return {
    scope: {
      selection: '=',
      model: '=',
      show: '=',
      changeNotifier: '='
    },
    restrict: 'E',
    template: require('./visualizationView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: VisualizationViewController
  };
});

export class VisualizationViewController {

  selection: Class|Predicate;
  model: Model;
  show: Show;

  enlargeVisualization() {
    this.show++;
  }

  shrinkVisualization() {
    this.show--;
  }
}
