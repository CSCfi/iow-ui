import { ILocationService, IScope, ui } from 'angular';
import IModalScope = ui.bootstrap.IModalScope;
import IModalStackService = ui.bootstrap.IModalStackService;
import { UserService } from '../services/userService';
import { config } from '../config';
import { ConfirmationModal } from './common/confirmationModal';
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
              $uibModalStack: IModalStackService,
              userService: UserService,
              confirmationModal: ConfirmationModal) {

    userService.updateLogin().then(() => this.applicationInitialized = true);
    $scope.$watch(() => $location.path(), path => this.showFooter = path === '/');
    this.production = config.production;

    $scope.$on('$locationChangeStart', (event, next) => {

      const modal = $uibModalStack.getTop();

      if (!!modal) {
        const modalScope: IModalScope = modal.value.modalScope;

        event.preventDefault();

        confirmationModal.openCloseModal().then(() => {
          modalScope.$dismiss();
          $location.url($location.url(next).hash());
        });
      }
    });
  }
}
