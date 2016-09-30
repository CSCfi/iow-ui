import { IAttributes, IScope, INgModelController, IParseService } from 'angular';
import { DisplayItemFactory, DisplayItem, Value } from './displayItemFactory';
import { EditableForm } from './editableEntityController';
import { LanguageContext } from '../../services/entities';
import { module as mod }  from './module';
import { isDefined } from '../../utils/object';

const NG_HIDE_CLASS = 'ng-hide';
const NG_HIDE_IN_PROGRESS_CLASS = 'ng-hide-animate';

interface EditableAttributes extends IAttributes {
  autofocus: string;
}

mod.directive('editable', /* @ngInject */ ($animate: any) => {
  return {
    scope: {
      title: '@',
      link: '=',
      valueAsLocalizationKey: '@',
      disable: '=',
      context: '=',
      onClick: '@',
      clipboard: '='
    },
    restrict: 'E',
    template: require('./editable.html'),
    transclude: true,
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['editable', '?^form'],
    link($scope: EditableScope, element: JQuery, attributes: EditableAttributes, [thisController, formController]: [EditableController, EditableForm]) {

      $scope.$watch(() => thisController.item.displayValue || thisController.isEditing(), show => {
        $animate[show ? 'removeClass' : 'addClass'](element, NG_HIDE_CLASS, {
          tempClasses: NG_HIDE_IN_PROGRESS_CLASS
        });
      });

      const input = element.find('[ng-model]');
      const ngModel = input.controller('ngModel');
      const isEditing = () => formController.editing && !thisController.disable;

      // move error messages element next to input
      input.after(element.find('error-messages').detach());

      if (attributes.hasOwnProperty('autofocus')) {
        $scope.$watch(() => isEditing(), (currentEditing) => {
          const shouldFocus = attributes.hasOwnProperty('autofocus') && (!isDefined(attributes.autofocus) || $scope.$parent.$eval(attributes.autofocus));

          if (shouldFocus && currentEditing) {
            setTimeout(() => input.focus(), 0);
          }
        });
      }

      // TODO: prevent hidden and non-editable fields participating validation with some more obvious mechanism
      $scope.$watchCollection(() => Object.keys(ngModel.$error), keys => {
        if (!isEditing()) {
          for (const key of keys) {
            ngModel.$setValidity(key, true);
          }
        }
      });

      thisController.isEditing = isEditing;
      $scope.ngModel = ngModel;

      Object.defineProperty(thisController, 'value', { get: () => ngModel && ngModel.$modelValue });
      Object.defineProperty(thisController, 'inputId', { get: () => input.attr('id') });
      Object.defineProperty(thisController, 'required', { get: () => !thisController.disable && (input.attr('required') || (ngModel && 'requiredLocalized' in ngModel.$validators)) });
    },
    controller: EditableController
  };
});

interface EditableScope extends IScope {
  ngModel: INgModelController;
}

class EditableController {

  value: Value;
  title: string;
  valueAsLocalizationKey: boolean;
  link: string;
  disable: boolean;
  required: boolean;
  inputId: string;
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
      onClick: onClick
    });
  }
}
