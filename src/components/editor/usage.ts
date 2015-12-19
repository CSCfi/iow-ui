import Dictionary = _.Dictionary;
import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { UsageService } from '../../services/usageService';
import { Usage, Referrer, Localizable, Uri, Curie, Type } from '../../services/entities';
import { DisplayItemFactory } from '../form/displayItemFactory';
import { EditableForm } from '../form/editableEntityController';
import { ModelCache } from '../../services/modelCache';

export const mod = angular.module('iow.components.editor');

interface UsageAttributes extends IAttributes {
  showLinks: string;
}

mod.directive('usage', () => {
  return {
    restrict: 'E',
    template: require('./usage.html'),
    scope: {
      usage: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['usage', '?^form'],
    link($scope: IScope, element: JQuery, attributes: UsageAttributes, controllers: [UsageController, EditableForm]) {
      const form: EditableForm = controllers[1];
      $scope.$watch(attributes.showLinks, (show: boolean) => controllers[0].showLinks = show && (!form || !form.editing));
    },
    controller: UsageController
  }
});

class UsageController {

  usage: Usage;
  showLinks: boolean;
  referrers: Dictionary<Referrer[]>;

  /* @ngInject */
  constructor($scope: IScope) {
    $scope.$watch(() => this.usage, usage => {
      this.usage = usage;
      if (usage && usage.referrers.length > 0) {
        this.referrers = _.groupBy<Referrer>(usage.referrers, 'type');
      }
    });
  }
}
