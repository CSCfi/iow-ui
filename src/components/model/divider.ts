import { IWindowService, IScope, ui } from 'angular';
import IModalScope = ui.bootstrap.IModalScope;
import { module as mod }  from './module';
import { SessionService } from '../../services/sessionService';

mod.directive('divider', () => {
  return {
    scope: {
      selectionWidth: '='
    },
    restrict: 'E',
    template: `<div class="divider" ng-mousedown="ctrl.moveDivider($event)"></div>`,
    controllerAs: 'ctrl',
    bindToController: true,
    controller: DividerController
  };
});

const modelPanelLeft = 275;
const minSelectionWidth = 500;
const normalSelectionWidth = 720;
const minVisualizationWidth = 321;

class DividerController {

  selectionWidth: number;

  /* @ngInject */
  constructor(private $scope: IScope, private $window: IWindowService, private sessionService: SessionService) {

    this.initWidth();

    const onResize = () => {
      this.initWidth();
      $scope.$apply();
    };

    $window.addEventListener('resize', onResize);
    $scope.$on('$destroy', () => $window.removeEventListener('resize', onResize));
  }

  initWidth() {
    this.selectionWidth = Math.min(this.maxWidth - minVisualizationWidth, this.sessionService.selectionWidth || normalSelectionWidth);
  }

  get maxWidth() {
    return this.$window.innerWidth - modelPanelLeft;
  }

  moveDivider(mouseDown: MouseEvent) {

    mouseDown.preventDefault();

    const offset = mouseDown.clientX - this.selectionWidth;
    const maxWidth = this.maxWidth;

    const onMouseMove = (event: MouseEvent) => {
      const newWidth = event.clientX - offset;

      if ((newWidth >= minSelectionWidth && newWidth < this.selectionWidth)
        || (newWidth <= (maxWidth - minVisualizationWidth) && newWidth > this.selectionWidth)) {
        this.sessionService.selectionWidth = newWidth;
        this.selectionWidth = newWidth;
        this.$scope.$apply();
      }
    };

    const onMouseUp = () => {
      this.$window.removeEventListener('mousemove', onMouseMove);
      this.$window.removeEventListener('mouseup', onMouseUp);
    };

    this.$window.addEventListener('mousemove', onMouseMove);
    this.$window.addEventListener('mouseup', onMouseUp);
  }
}
