import { IAttributes, IParseService, IScope } from 'angular';
import { DisplayItemFactory, DisplayItem, Value } from './displayItemFactory';
import { EditableForm } from './editableEntityController';
import { LanguageContext } from '../../services/entities';
import { module as mod }  from './module';

mod.directive('nonEditable', () => {
  return {
    scope: {
      title: '@',
      value: '=',
      link: '=',
      onClick: '@',
      valueAsLocalizationKey: '@',
      context: '=',
      clipboard: '='
    },
    restrict: 'E',
    template: require('./nonEditable.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['nonEditable', '?^form'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, formController]: [NonEditableController, EditableForm]) {
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
  onClick: string;
  clipboard: string;

  isEditing: () => boolean;
  item: DisplayItem;

  /* @ngInject */
  constructor($scope: IScope, $parse: IParseService, displayItemFactory: DisplayItemFactory) {

    // we need to know if handler was set or not so parse ourselves instead of using scope '&'
    const clickHandler = $parse(this.onClick);
    const onClick = this.onClick ? (value: Value) => clickHandler($scope.$parent, {value}) : null;

    this.item = displayItemFactory.create({
      context: () => this.context,
      value: () => this.value,
      link: () => this.link,
      valueAsLocalizationKey: this.valueAsLocalizationKey,
      hideLinks: () => this.isEditing(),
      onClick: onClick
    });
  }

  get style(): {} {
    if (this.isEditing()) {
      return { 'margin-bottom': '33px'};
    } else {
      return {};
    }
  }
}
