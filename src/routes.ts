import IRouteProvider = angular.route.IRouteProvider;
import IRouteService = angular.route.IRouteService;

export function routeConfig($routeProvider: IRouteProvider) {
  'ngInject';

  $routeProvider
    .when('/', {
      template: '<front-page></front-page>',
    })
    .when('/user', {
      template: '<user></user>',
    })
    .when('/group', {
      template: '<group groupId="groupId"></group>',
      resolve: {
        groupId($route: IRouteService) {
          return $route.current.params.urn;
        }
      }
    })
    .when('/model', {
      template: '<model></model>',
      reloadOnSearch: false
    });
};
