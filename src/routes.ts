import { route } from 'angular';
import { Uri } from './entities/uri';
import { ILocationService } from 'angular';
import { resourceUrl, modelUrl } from './utils/entity';
import { NotificationModal } from './components/common/notificationModal';

/* @ngInject */
export function routeConfig($routeProvider: route.IRouteProvider) {
  $routeProvider
    .when('/', {
      template: '<front-page></front-page>'
    })
    .when('/user', {
      template: '<user></user>'
    })
    .when('/group', {
      template: '<group-page group-id="groupId"></group-page>',
      controller($scope: any, $route: route.IRouteService) {
        $scope.groupId = new Uri($route.current!.params.id, {});
      }
    })
    .when('/newModel', {
      template: '<new-model-page prefix="prefix" label="label" group="group" languages="languages" type="type" redirect="redirect"></new-model-page>',
      controller($scope: any, $route: route.IRouteService) {
        const params: any = $route.current!.params;

        $scope.prefix = params.prefix;
        $scope.label = params.label;
        $scope.group = new Uri(params.group, {});
        $scope.languages = params.language;
        $scope.type = params.type;
        $scope.redirect = params.redirect && new Uri(params.redirect, {});
      }
    })
    .when('/ns/:prefix*', {
      template: '',
      controller($location: ILocationService, $route: route.IRouteService) {
        const prefix = $route.current!.params.prefix;
        const resource = $location.hash();

        if (resource) {
          $location.url(resourceUrl(prefix, new Uri(prefix + ':' + resource, {})));
        } else {
          $location.url(modelUrl(prefix));
        }
      }
    })
    .when('/model/:prefix/:resource?/:property?', {
      template: '<model-page></model-page>',
      reloadOnSearch: false
    })
    .otherwise({
      template: '',
      /* @ngInject */
      controller(notificationModal: NotificationModal) {
        notificationModal.openPageNotFound();
      }
    });
}
