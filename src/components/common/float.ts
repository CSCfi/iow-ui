import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import IWindowService = angular.IWindowService;
import ITimeoutService = angular.ITimeoutService;
import * as _ from 'lodash';

import { module as mod }  from './module';

interface FloatAttributes extends IAttributes {
  float: string;
  topOffset: number;
}

mod.directive('float', ($window: IWindowService, $timeout: ITimeoutService) => {
  /* @ngInject */
  return {
    restrict: 'A',
    link($scope: IScope, element: JQuery, attributes: FloatAttributes) {
      const windowElement = angular.element($window);
      const placeholderClass = attributes.float;
      const topOffset = attributes.topOffset || 0;
      let placeholder =
        jQuery(document.createElement('div'))
          .hide()
          .addClass(placeholderClass)
          .insertBefore(element);
      let elementLocation: {top: number, left: number} = null;
      let floating = false;

      element.attr('will-change', 'scroll-position');

      // after DOM is fully rendered, initialize element location
      (function init() {
        refreshElementLocation();
        if (!isInitialized()) {
          $timeout(init, 500);
        }
      })();

      windowElement.on('scroll', () => {
        if (isInitialized()) {
          if (!floating) {
            if (window.pageYOffset >= elementLocation.top) {
              setFloating();
            }
          } else if (window.pageYOffset < elementLocation.top) {
            setStatic();
          }
        }
      });

      // re-refresh has to be done since location can change due to accordion etc
      windowElement.on('scroll', _.throttle(refreshElementLocation, 500));

      function isInitialized() {
        return elementLocation && elementLocation.top > 0;
      }

      function refreshElementLocation() {
        if (!floating) {
          const offset = element.offset();
          elementLocation = {top: offset.top - topOffset, left: offset.left};
        }
      }

      function setFloating() {
        floating = true;
        placeholder.css('width', element.outerWidth() + 'px');
        placeholder.css('height', element.outerHeight() + 'px');
        element.css('left', elementLocation.left + 'px');
        element.css('top', topOffset + 'px');
        element.css('width', element.outerWidth() + 'px');
        element.css('position', 'fixed');
        placeholder.show();
      }

      function setStatic() {
        floating = false;
        element.css('left', '');
        element.css('top', '');
        element.css('position', '');
        element.css('width', '');
        placeholder.hide();
      }
    }
  };
});
