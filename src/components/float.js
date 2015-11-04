module.exports = function directive($window, $timeout) {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'A',
    link($scope, element, attributes) {
      const placeholderClass = attributes.float;
      const floatTop = attributes.floatTop || 0;
      let elementLocation = null;
      let addedPlaceholder = null;

      element.attr('will-change', 'scroll-position');

      // after DOM is fully rendered, initialize element location
      $timeout(() => {
        $timeout(() => {
          refreshElementLocation();
        });
      });

      angular.element($window).on('scroll', () => {
        if (elementLocation) {
          if (!addedPlaceholder) {
            // re-refresh has to be done since location can change due to accordion etc
            refreshElementLocation();
            if (window.pageYOffset >= elementLocation.top) {
              setFloating();
              addedPlaceholder = createPlaceholder().insertBefore(element);
            }
          } else if (window.pageYOffset < elementLocation.top) {
            setStatic();
            addedPlaceholder.remove();
            addedPlaceholder = null;
          }
        }
      });

      function refreshElementLocation() {
        const offset = element.offset();
        elementLocation = {top: offset.top - floatTop, left: offset.left};
      }

      function createPlaceholder() {
        return jQuery(document.createElement('div'))
          .css('width', element.outerWidth() + 'px')
          .css('height', element.outerHeight() + 'px')
          .addClass(placeholderClass);
      }

      function setFloating() {
        element.css('left', elementLocation.left + 'px');
        element.css('top', floatTop + 'px');
        element.css('position', 'fixed');
      }

      function setStatic() {
        element.css('left', 'auto');
        element.css('top', 'auto');
        element.css('position', 'static');
      }
    }
  };
};
