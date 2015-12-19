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

interface UsagesAttributes extends IAttributes {
  showLinks: string;
}

mod.directive('usages', () => {
  return {
    restrict: 'E',
    template: require('./usages.html'),
    scope: {
      usage: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['usages', '?^form'],
    link($scope: IScope, element: JQuery, attributes: UsagesAttributes, controllers: [UsagesController, EditableForm]) {
      const form: EditableForm = controllers[1];
      $scope.$watch(attributes.showLinks, (show: boolean) => controllers[0].showLinks = show && (!form || !form.editing));
    },
    controller: UsagesController
  }
});

class UsagesController {

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
