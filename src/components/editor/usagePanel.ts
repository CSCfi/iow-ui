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
    $scope.$watch(() => this.open, open => {
      if (open && !this.usage) {
        this.loading = true;
        usageService.getUsage(this.id).then(usage => {
          this.usage = usage;
          this.loading = false;
        });
      }
    });
    $scope.$watch(() => this.id, () => {
      if (this.open) {
        this.updateUsage();
      } else {
        this.usage = null;
      }
    });
  }

  hasReferrers() {
    return this.usage && this.usage.referrers.length > 0;
  }

  private updateUsage() {
    this.usageService.getUsage(this.id).then(usage => this.usage = usage);
  }
}