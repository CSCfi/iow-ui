import { module as mod }  from './module';
import { Class, Model, Predicate } from '../../services/entities';
import { Show } from '../contracts';
import { IScope, IAttributes } from 'angular';
import { FloatController } from '../common/float';

mod.directive('visualizationView', () => {
  return {
    scope: {
      selection: '=',
      model: '=',
      show: '=',
      changeNotifier: '=',
      selectClassById: '=',
      selectionWidth: '='
    },
    restrict: 'E',
    template: require('./visualizationView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['visualizationView', 'float'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, floatController]: [VisualizationViewController, FloatController]) {

      $scope.$watchGroup([() => thisController.selectionWidth, () => thisController.show, () => floatController.floating], ([selectionWidth, show, floating]) => {

        console.log(floating);
        console.log(floatController);
        const width = show === Show.Both ? `calc(100% - ${selectionWidth + 10 + (floating ? 295 : 0)}px)` : '100%';

        element.css({
          'padding-left': show === Show.Visualization ? '5px' : 0,
          width: width
        });

        floatController.setWidth(width);

        if (show === Show.Both) {
          floatController.enableFloating();
        } else {
          floatController.disableFloating();
        }

        if (show === Show.Selection) {
          element.addClass('hide');
        } else {
          element.removeClass('hide');
        }
      });
    },
    controller: VisualizationViewController
  };
});

export class VisualizationViewController {

  selection: Class|Predicate;
  model: Model;
  show: Show;
  selectionWidth: number;

  enlargeVisualization() {
    this.show++;
  }

  shrinkVisualization() {
    this.show--;
  }
}
