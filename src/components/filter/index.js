const name = 'iow.components.filter';
const mod = angular.module(name, []);
module.exports = name;

mod.filter('translateValue', (modelLanguage) => {
  return (input) => input ? modelLanguage.translate(input) : '';
});

mod.filter('translateLabel', (translateValueFilter) => {
  return input => input ? translateValueFilter(input.label) : '';
});

mod.filter('orderByLabel', (translateLabelFilter, orderByFilter) => {
  return array => {
    return orderByFilter(array, translateLabelFilter);
  };
});

mod.filter('urlencode', function urlencode() {
  return input => {
    return window.encodeURIComponent(input);
  };
});

