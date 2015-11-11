module.exports = function directive($window, $timeout) {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'A',
    link($scope, element, attributes) {
      const placeholderClass = attributes.float;
      const topOffset = attributes.topOffset || 0;
      const preserveParentWidth = attributes.preserveParentWidth;
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
        if (isInitialized()) {
          if (!isFloating()) {
            // re-refresh has to be done since location can change due to accordion etc
            refreshElementLocation();
            if (window.pageYOffset >= elementLocation.top) {
              setFloating();
            }
          } else if (window.pageYOffset < elementLocation.top) {
            setStatic();
          }
        }
      });

      function isInitialized() {
        return elementLocation;
      }

      function isFloating() {
        return addedPlaceholder;
      }

      function refreshElementLocation() {
        const offset = element.offset();
        elementLocation = {top: offset.top - topOffset, left: offset.left};
      }

      function createPlaceholder() {
        return jQuery(document.createElement('div'))
          .css('width', element.outerWidth() + 'px')
          .css('height', element.outerHeight() + 'px')
          .addClass(placeholderClass);
      }

      function setFloating() {
        element.css('left', elementLocation.left + 'px');
        element.css('top', topOffset + 'px');
        element.css('position', 'fixed');
        if (preserveParentWidth) {
          element.css('width', element.parent().width());
        }
        addedPlaceholder = createPlaceholder().insertBefore(element);
      }

      function setStatic() {
        element.css('left', '');
        element.css('top', '');
        element.css('position', '');
        element.css('width', '');
        addedPlaceholder.remove();
        addedPlaceholder = null;
      }
    }
  };
};
