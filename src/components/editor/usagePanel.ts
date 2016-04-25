import IScope = angular.IScope;
import { UsageService } from '../../services/usageService';
import { Usage, EditableEntity, LanguageContext } from '../../services/entities';

import { module as mod }  from './module';

mod.directive('usagePanel', () => {
  return {
    restrict: 'E',
    scope: {
      entity: '=',
      context: '='
    },
    template: require('./usagePanel.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    controller: UsagePanelController
  };
});

class UsagePanelController {

  entity: EditableEntity;
  context: LanguageContext;
  usage: Usage;
  open: boolean;
  loading: boolean;

  /* @ngInject */
  constructor($scope: IScope, private usageService: UsageService) {
    $scope.$watch(() => this.open, () => this.updateUsage());
    $scope.$watch(() => this.entity, () => this.updateUsage());
  }

  hasReferrers() {
    return this.usage && this.usage.referrers.length > 0;
  }

  private updateUsage() {
    if (this.open && (!this.usage || this.usage.id.notEquals(this.entity.id))) {
      this.loading = true;
      this.usageService.getUsage(this.entity).then(usage => {
        this.usage = usage;
        this.loading = false;
      });
    } else {
      this.usage = null;
    }
  }
}
