import { module as mod }  from './module';
import { IScope, IAttributes } from 'angular';

interface FloatAttributes extends IAttributes {
  float: string;
  always: string;
  snap: string;
}

mod.directive('float', () => {
  return {
    restrict: 'A',
    controller: FloatController,
    require: 'float',
    link($scope: IScope, element: JQuery, attributes: FloatAttributes, ctrl: FloatController) {

      const placeholderClass = attributes.float;
      const shouldSnap = attributes.snap === 'true';
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

      let timeoutId: any = null;

      function snap(destination: number) {
        if (Math.abs(destination - window.scrollY) < 3) {
          scrollTo(window.scrollX, destination + 1);
        } else if (Math.abs(destination - window.scrollY) < 80) {
          scrollTo(window.scrollX, window.scrollY + ((destination - window.scrollY) / 2));
          setTimeout(snap, 20, destination);
        }
      }

      function scrollHandler() {

        if (shouldSnap) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          timeoutId = setTimeout(snap, 200, elementStaticLocation.top);
        }

        if (!ctrl.floating) {
          // re-refresh has to be done since location can change due to accordion etc
          elementStaticLocation = element.offset();
        }

        if (ctrl.floating) {
          if (ctrl.canSetStatic()) {
            ctrl.setStatic();
            elementStaticLocation = element.offset();
            $scope.$apply();
          }
        } else {
          if (ctrl.canSetFloating()) {
            ctrl.setFloating();
            $scope.$apply();
          }
        }
      }

      window.addEventListener('scroll', scrollHandler, true);

      $scope.$on('$destroy', () => {
        window.removeEventListener('scroll', scrollHandler);
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

  canSetFloating() {
    return this.enabled && this.isFloatingPosition();
  }

  canSetStatic() {
    return this.isStaticPosition();
  }

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

    if (this.canSetFloating()) {
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

    if (this.canSetStatic()) {
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
