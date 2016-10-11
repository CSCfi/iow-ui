import { module as mod }  from '../module';
import { IAttributes, IScope } from 'angular';
import * as _ from 'lodash';
import Dictionary = _.Dictionary;
import { EditableForm } from '../form/editableEntityController';
import { Referrer, Usage } from '../../entities/usage';
import { LanguageContext } from '../../entities/contract';

interface UsageAttributes extends IAttributes {
  showLinks: string;
}

const noExclude = (_referrer: Referrer) => false;

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
  referrers: Dictionary<Referrer[]>;

  /* @ngInject */
  constructor($scope: IScope) {
    $scope.$watch(() => this.usage, usage => {
      if (usage) {
        this.referrers = _.groupBy<Referrer>(_.reject(usage.referrers, this.exclude || noExclude), 'normalizedType');
      } else {
        this.referrers = {};
      }
    });
  }
}
