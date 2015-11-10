module.exports = function idInputDirective() {
  'ngInject';
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope, element, attributes, modelController) {
      let prefix = '';

      modelController.$parsers.push(value => {
        return prefix ? (prefix + ':' + value) : value;
      });

      modelController.$formatters.push(value => {
        if (value) {
          const split = value.split(':');
          prefix = split[0];
          return split[1];
        }
      });
    }
  };
};
