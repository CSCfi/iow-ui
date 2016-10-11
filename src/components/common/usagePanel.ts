import { module as mod }  from './module';
import { IScope } from 'angular';
import { UsageService } from '../../services/usageService';
import { EditableEntity, LanguageContext } from '../../entities/contract';
import { Usage } from '../../entities/usage';

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
  usage: Usage|null = null;
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
    if (this.open) {
      if (!this.usage || this.usage.id.notEquals(this.entity.id)) {
        this.loading = true;
        this.usageService.getUsage(this.entity).then(usage => {
          this.usage = usage;
          this.loading = false;
        });
      }
    } else {
      this.usage = null;
    }
  }
}
