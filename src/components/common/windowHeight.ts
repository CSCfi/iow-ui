import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import IWindowService = angular.IWindowService;
import { UserService } from '../../services/userService';

export const mod = angular.module('iow.components.common');

interface WindowHeightAttributes extends IAttributes {
  windowHeight: string;
  padding: number;
  loggedInPadding: number;
}

mod.directive('windowHeight', ($window: IWindowService, userService: UserService) => {
  'ngInject';
  return {
    restrict: 'A',
    link($scope: IScope, element: JQuery, attributes: WindowHeightAttributes) {
      const minHeight = attributes.windowHeight === 'min';
      const noScroll = attributes.windowHeight === 'no-scroll';

      function getPadding(): number {
        const padding = attributes.padding || 0;
        const loggedInPadding = attributes.loggedInPadding || padding;
        return userService.isLoggedIn() ? loggedInPadding : padding;
      }

      function setHeight() {
        const height = $window.innerHeight - getPadding();
        if (minHeight) {
          element.css('min-height', height + 'px');
        } else {
          element.css('overflow-y', noScroll ? 'hidden' : 'scroll').css('height', height + 'px');
        }
      }

      setHeight();
      angular.element($window).on('resize', setHeight);
      if (attributes.loggedInPadding) {
        $scope.$watch(() => userService.isLoggedIn(), setHeight);
      }
    }
  };
});
