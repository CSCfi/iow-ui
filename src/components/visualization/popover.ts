import { module as mod } from './module';
import { Coordinate, Localizable, LanguageContext, Dimensions } from '../../services/entities';
import { IScope, IAttributes, ITimeoutService } from 'angular';
import { hasLocalization } from '../../utils/language';

export interface VisualizationPopoverDetails {
  coordinate: Coordinate;
  comment: Localizable;
}

mod.directive('visualizationPopover', () => {
  return {
    scope: {
      details: '=',
      context: '='
    },
    restrict: 'E',
    bindToController: true,
    controllerAs: 'ctrl',
    controller: VisualizationPopoverController,
    template: `
       <div class="popover left" ng-style="ctrl.style">
         <div class="arrow"></div>
         <div class="popover-inner">
           <div class="popover-content">{{ctrl.details.comment | translateValue: ctrl.context}}</div>
         </div>
       </div>
    `,
    require: 'visualizationPopover',
    link($scope: IScope, element: JQuery, attributes: IAttributes, ctrl: VisualizationPopoverController) {

      const popoverElement = element.find('.popover');

      ctrl.getDimensions = () => {
        return {
          width: popoverElement.outerWidth(),
          height: popoverElement.outerHeight()
        };
      };
    }
  };
});

class VisualizationPopoverController {
  details: VisualizationPopoverDetails;
  context: LanguageContext;

  getDimensions: () => Dimensions;
  style: any = {};

  constructor($scope: IScope, $timeout: ITimeoutService) {
    $scope.$watch(() => this.details, details => {
      // Hide by keeping off screen absolute position
      this.style = { top: -1000 + 'px',  left: -1000 + 'px' };

      if (details && hasLocalization(details.comment)) {
        this.style.comment = details.comment;

        // Let the comment render before accessing calculated dimensions
        $timeout(() => {
          const dimensions = this.getDimensions();
          this.style.top = (details.coordinate.y - (dimensions.height / 2)) + 'px';
          this.style.left = (details.coordinate.x - dimensions.width - 15) + 'px';
        });
      }
    });
  }
}
