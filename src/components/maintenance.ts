import IPromise = angular.IPromise;
import IScope = angular.IScope;
import ILogService = angular.ILogService;

export class MaintenanceModal {
  /* @ngInject */
  constructor(private $uibModal: angular.ui.bootstrap.IModalService, private $log: ILogService) {
  }

  open(err: any) {

    this.$log.debug(err);

    return this.$uibModal.open({
      template: require('./maintenance.html'),
      size: 'large',
      backdrop: false,
    }).result;
  }
}
