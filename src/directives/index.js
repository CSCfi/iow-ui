const name = 'iow.directives';

const mod = angular.module(name, []);

mod.directive('groupList', require('./groupList'));
mod.directive('classView', require('./classView'));
mod.directive('attributeView', require('./attributeView'));
mod.directive('associationView', require('./associationView'));
mod.directive('globalLanguageChooser', require('./globalLanguageChooser'));

mod.filter('urlencode', function urlencode() {
  return input => {
    return window.encodeURIComponent(input);
  };
});

module.exports = name;
