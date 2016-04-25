import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import { DisplayItemFactory, DisplayItem, Value } from './displayItemFactory';
import { EditableForm } from './editableEntityController';

import { module as mod }  from './module';
import { LanguageContext } from '../../services/entities';

mod.directive('nonEditable', () => {
  return {
    scope: {
      title: '@',
      value: '=',
      link: '=',
      valueAsLocalizationKey: '@',
      context: '='
    },
    restrict: 'E',
    template: require('./nonEditable.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['nonEditable', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [NonEditableController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: NonEditableController
  };
});

class NonEditableController {

  title: string;
  value: Value;
  link: string;
  valueAsLocalizationKey: boolean;
  context: LanguageContext;

  isEditing: () => boolean;
  item: DisplayItem;

  /* @ngInject */
  constructor(displayItemFactory: DisplayItemFactory) {
    this.item = displayItemFactory.create(() => this.context, () => this.value, (value) => this.link, this.valueAsLocalizationKey, () => this.isEditing());
  }
}
