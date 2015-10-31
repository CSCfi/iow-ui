window.jQuery = require('jquery');
const angular = require('angular');

require('angular-gettext');
require('./vendor/angular-xeditable-0.1.8/js/xeditable');

angular.module('iow-ui', [
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'gettext',
  'xeditable',
  require('./components'),
  require('./services')
])
.config(function mainConfig($routeProvider) {
  $routeProvider
    .when('/', {
      template: require('./components/templates/index.html')
    })
    .when('/groups', {
      template: require('./components/templates/group.html'),
      controller: 'groupController',
      controllerAs: 'ctrl'
    })
    .when('/models', {
      template: require('./components/templates/model.html'),
      controller: 'modelController',
      controllerAs: 'ctrl',
      reloadOnSearch: false,
      resolve: {
        modelId($route) {
          return $route.current.params.urn;
        },
        selected($route) {
          'ngInject';
          for (const type of ['attribute', 'class', 'association']) {
            const id = $route.current.params[type];
            if (id) {
              return {type, id};
            }
          }
        }
      }
    });
})
.run(function onAppRun($rootScope, $q, editableOptions, languageService, userService, gettextCatalog) {
  editableOptions.theme = 'bs3';

  function languageChanged() {
    const deferred = $q.defer();
    const deregister = $rootScope.$on('gettextLanguageChanged', () => {
      deferred.resolve();
      deregister();
    });
    return deferred;
  }

  $q.all([languageChanged(), userService.updateLogin()]).then(() => $rootScope.applicationInitialized = true);

  gettextCatalog.debug = true;
  languageService.setLanguage('fi');
})
.controller('AppCtrl', function mainAppCtrl($scope, $location) {

});
