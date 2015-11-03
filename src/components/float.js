function createPlaceholder(width, height, placeholderClass) {
  const placeholder = document.createElement('div');
  placeholder.style.width = width + 'px';
  placeholder.style.height = height + 'px';
  if (placeholderClass) {
    placeholder.classList.add(placeholderClass);
  }
  return placeholder;
}

function setFloating(element, settings) {
  element.css('left', settings.dimensions.left + 'px');
  element.css('top', settings.floatTop + 'px');
  element.css('position', 'fixed');
  const addedPlaceholder = createPlaceholder(element.outerWidth(), element.outerHeight(), settings.placeholderClass);
  element[0].parentNode.insertBefore(addedPlaceholder, element[0]);
  return addedPlaceholder;
}

function setStatic(element, placeholder) {
  element.css('left', 'auto');
  element.css('top', 'auto');
  element.css('position', 'static');
  element[0].parentNode.removeChild(placeholder);
  return null;
}

module.exports = function directive($window, $timeout) {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'A',
    link($scope, element, attributes) {
      const settings = {
        placeholderClass: attributes.float,
        floatTop: attributes.floatTop || 0,
        dimensions: null
      };

      let addedPlaceholder = null;

      element.attr('will-change', 'scroll-position');

      function getDimensions() {
        const offset = element.offset();
        return {top: offset.top - settings.floatTop, left: offset.left};
      }

      $timeout(() => {
        $timeout(() => {
          settings.dimensions = getDimensions();
        });
      });

      angular.element($window).on('scroll', () => {
        if (settings.dimensions) {
          if (!addedPlaceholder) {
            settings.dimensions = getDimensions();
            if (window.pageYOffset >= settings.dimensions.top) {
              addedPlaceholder = setFloating(element, settings);
            }
          } else if (window.pageYOffset < settings.dimensions.top) {
            addedPlaceholder = setStatic(element, addedPlaceholder);
          }
        }
      });
    }
  };
};
