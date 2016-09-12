import { ILogService, ui } from 'angular';

export class MaintenanceModal {
  /* @ngInject */
  constructor(private $uibModal: ui.bootstrap.IModalService, private $log: ILogService) {
  }

  open(err: any) {

    this.$log.debug(err);

    return this.$uibModal.open({
      template: require('./maintenance.html'),
      size: 'large',
      backdrop: 'static'
    }).result;
  }
}
