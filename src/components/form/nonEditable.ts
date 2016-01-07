import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Localizable, isLocalizable } from '../../services/entities';
import { isString } from '../../services/utils';
import { LanguageService } from '../../services/languageService';
import { DisplayItemFactory, DisplayItem, Value } from './displayItemFactory';
import { EditableForm } from './editableEntityController';

export const mod = angular.module('iow.components.form');

mod.directive('nonEditable', () => {
  'ngInject';
  return {
    scope: {
      title: '@',
      value: '=',
      link: '=',
      valueAsLocalizationKey: '@'
    },
    restrict: 'E',
    template: require('./nonEditable.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['nonEditable', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, controllers: [NonEditableController, EditableForm]) {
      controllers[0].isEditing = () => controllers[1].editing;
    },
    controller: NonEditableController
  };
});

class NonEditableController {

  title: string;
  value: Value;
  link: string;
  valueAsLocalizationKey: boolean;
  isEditing: () => boolean;

  item: DisplayItem;

  /* @ngInject */
  constructor(displayItemFactory: DisplayItemFactory) {
    this.item = displayItemFactory.create(() => this.value, (value: string) => this.link, this.valueAsLocalizationKey, () => this.isEditing())
  }
}
