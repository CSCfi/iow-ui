import { module as mod }  from './module';
import { IScope, IAttributes, IWindowService } from 'angular';

interface FloatAttributes extends IAttributes {
  float: string;
  always: string;
}

mod.directive('float', ($window: IWindowService) => {
  return {
    restrict: 'A',
    controller: FloatController,
    require: 'float',
    link($scope: IScope, element: JQuery, attributes: FloatAttributes, ctrl: FloatController) {

      const windowElement = angular.element($window);
      const placeholderClass = attributes.float;
      let elementStaticLocation = element.offset();

      ctrl.element = element;
      ctrl.always = attributes.always === 'true';
      ctrl.placeholder =
        jQuery(document.createElement('div'))
          .hide()
          .addClass(placeholderClass)
          .insertBefore(element);

      ctrl.isFloatingPosition = () => window.pageYOffset >= elementStaticLocation.top;
      ctrl.isStaticPosition = () => window.pageYOffset < elementStaticLocation.top;

      element.attr('will-change', 'scroll-position');

      windowElement.on('scroll', () => {

        if (!ctrl.floating) {
          // re-refresh has to be done since location can change due to accordion etc
          elementStaticLocation = element.offset();
        }

        if (isInitialized()) {
          if (ctrl.floating) {
            if (ctrl.isStaticPosition()) {
              ctrl.setStatic();
              elementStaticLocation = element.offset();
              $scope.$apply();
            }
          } else {
            if (ctrl.enabled && ctrl.isFloatingPosition()) {
              ctrl.setFloating();
              $scope.$apply();
            }
          }
        }
      });

      function isInitialized() {
        return elementStaticLocation.top > 0;
      }
    }
  };
});

export class FloatController {

  element: JQuery;
  placeholder: JQuery;

  always: boolean;
  isFloatingPosition: () => boolean;
  isStaticPosition: () => boolean;

  floating: boolean = false;
  enabled = true;
  width: string|number;

  setFloating() {
    this.floating = true;
    const width = this.width || this.element.outerWidth() + 'px';

    this.placeholder.css({
      width: width,
      height: this.element.outerHeight() + 'px'
    });

    this.element.css({
      top: 0,
      width: width
    });

    this.element.addClass('floating');

    if (this.always) {
      this.element.addClass('always');
    }

    if (this.enabled) {
      this.placeholder.show();
    }
  }

  setStatic() {
    this.floating = false;
    this.element.css('top', '');
    this.element.css('width', this.width || '');

    this.element.removeClass('floating');

    if (this.always) {
      this.element.removeClass('always');
    }

    this.placeholder.hide();
  }

  enableFloating() {
    this.enabled = true;

    if (this.isFloatingPosition()) {
      if (this.floating) {
        this.placeholder.show();
      } else {
        this.setFloating();
      }
    }

    this.element.removeClass('no-floating');
  }

  disableFloating() {
    this.enabled = false;

    if (this.isStaticPosition()) {
      if (this.floating) {
        this.setStatic();
      }
    } else if (this.floating) {
      this.placeholder.hide();
    }

    this.element.addClass('no-floating');
  }

  setWidth(width: string|number) {
    this.width = width;
    this.placeholder.css('width', width);
    this.element.css('width', width);
  }
}
