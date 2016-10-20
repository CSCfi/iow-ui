import { module as mod }  from '../module';
import { IAttributes, IScope } from 'angular';
import { EditableForm } from '../form/editableEntityController';
import { Referrer, Usage } from '../../entities/usage';
import { LanguageContext } from '../../entities/contract';
import { groupBy } from '../../utils/array';
import { stringMapToObject } from '../../utils/object';

interface UsageAttributes extends IAttributes {
  showLinks: string;
}

mod.directive('usage', () => {
  return {
    restrict: 'E',
    template: require('./usage.html'),
    scope: {
      usage: '=',
      exclude: '=',
      context: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['usage', '?^form'],
    link($scope: IScope, _element: JQuery, attributes: UsageAttributes, [thisController, formController]: [UsageController, EditableForm]) {
      $scope.$watch(attributes.showLinks, (show: boolean) => thisController.showLinks = () => show && (!formController || !formController.editing));
    },
    controller: UsageController
  };
});

class UsageController {

  usage: Usage;
  exclude: (referrer: Referrer) => boolean;
  context: LanguageContext;
  showLinks: () => boolean;
  referrers: { [type: string]: Referrer[] };

  /* @ngInject */
  constructor($scope: IScope) {
    $scope.$watch(() => this.usage, usage => {
      if (usage) {
        const excludeFilter = (referrer: Referrer) => referrer.normalizedType && !this.exclude || !this.exclude(referrer);
        this.referrers = stringMapToObject(groupBy(usage.referrers.filter(excludeFilter), referrer => referrer.normalizedType!));
      } else {
        this.referrers = {};
      }
    });
  }
}
