import ILocationService = angular.ILocationService;
import IModalScope = angular.ui.bootstrap.IModalScope;
import IWindowService = angular.IWindowService;
import IScope = angular.IScope;
import { UserService } from '../services/userService';
import { config } from '../config';
import { isConfirmationModalScope, ConfirmationModal } from './common/confirmationModal';
import { module as mod }  from './module';

mod.directive('application', () => {
  return {
    restrict: 'E',
    template: require('./application.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    controller: ApplicationController
  };
});

class ApplicationController {

  applicationInitialized: boolean;
  showFooter: boolean;
  production: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              $location: ILocationService,
              $window: IWindowService,
              userService: UserService,
              confirmationModal: ConfirmationModal) {

    userService.updateLogin().then(() => this.applicationInitialized = true);
    $scope.$watch(() => $location.path(), path => this.showFooter = path === '/');
    this.production = config.production;

    $scope.$on('$locationChangeStart', (event, next) => {
      const modalElement = angular.element($window.document).find('body [uib-modal-window]');

      if (modalElement.length > 0) {
        const modalScope = <IModalScope> modalElement.scope();

        if (!isConfirmationModalScope(modalScope)) {
          event.preventDefault();

          confirmationModal.openCloseModal().then(() => {
            modalScope.$dismiss();
            $location.url($location.url(next).hash());
          });
        }
      }
    });
  }
}
