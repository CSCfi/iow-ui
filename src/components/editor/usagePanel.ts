import IScope = angular.IScope;
import { UsageService } from '../../services/usageService';
import { Usage, Uri } from '../../services/entities';

export const mod = angular.module('iow.components.editor');

mod.directive('usagePanel', () => {
  return {
    restrict: 'E',
    scope: {
      id: '='
    },
    template: require('./usagePanel.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    controller: UsagePanelController
  }
});

class UsagePanelController {

  id: Uri;
  usage: Usage;
  open: boolean;
  loading: boolean;

  /* @ngInject */
  constructor($scope: IScope, private usageService: UsageService) {
    $scope.$watch(() => this.open, () => this.updateUsage());
    $scope.$watch(() => this.id, () => this.updateUsage());
  }

  hasReferrers() {
    return this.usage && this.usage.referrers.length > 0;
  }

  private updateUsage() {
    if (this.open && (!this.usage || this.usage.id !== this.id)) {
      this.loading = true;
      this.usageService.getUsage(this.id).then(usage => {
        this.usage = usage;
        this.loading = false;
      });
    } else {
      this.usage = null;
    }
  }
}
