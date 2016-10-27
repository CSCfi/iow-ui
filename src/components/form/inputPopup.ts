import { module as mod } from './module';
import { IScope, IAttributes, ITranscludeFunction, IRepeatScope } from 'angular';
import { scrollToElement, hasFixedPositioningParent } from '../../utils/angular';

export interface InputWithPopupController<T> {
  popupItemName: string;
  show: boolean;
  popupItems: T[];
  isSelected(index: number): boolean;
  setSelection(index: number): void;
  selectSelection(event?: JQueryEventObject): void;
  selectedSelectionIndex: number;
  element: JQuery;
}

interface InputPopupScope extends IScope {
  ctrl: InputPopupController<any>;
}

mod.directive('inputPopup', () => {
  return {
    scope: {
      ctrl: '<'
    },
    template: `
        <div ng-if-body="ctrl.ctrl.show" class="input-popup">
          <ul class="dropdown-menu" ng-style="ctrl.popupStyle">
            <li ng-repeat="item in ctrl.ctrl.popupItems"
                ng-class="{ active: ctrl.ctrl.isSelected($index) }" 
                ng-mouseenter="ctrl.ctrl.setSelection($index)" 
                ng-mousedown="ctrl.ctrl.selectSelection(event)"
                input-popup-select-item="ctrl.ctrl">
              <a href=""><input-popup-item-transclude></input-popup-item-transclude></a>
            </li>
          </ul>
        </div>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    transclude: true,
    controller: InputPopupController
  };
});

class InputPopupController<T> {

  ctrl: InputWithPopupController<T>;
  popupStyle: { top: string|number, left: string|number, width: string|number, position: string };

  /* @ngInject */
  constructor($scope: InputPopupScope) {


      const calculatePopupStyle = (e: JQuery) => {
        const offset = e.offset();
        const fixed = hasFixedPositioningParent(e);
        return {
          position: fixed ? 'fixed' : 'absolute',
          top: offset.top + e.prop('offsetHeight') - (fixed ? window.pageYOffset : 0),
          left: offset.left,
          width: e.prop('offsetWidth')
        };
      };

      $scope.$watch(() => this.ctrl.show, () => this.popupStyle = calculatePopupStyle(this.ctrl.element));

      $scope.$watch(() => {
        const offset = this.ctrl.element.offset();
        return {
          left: offset.left,
          top: offset.top
        };
      }, () => this.popupStyle = calculatePopupStyle(this.ctrl.element), true);

      const setPopupStyleToElement = () => {
        if (this.ctrl.show) {
          this.popupStyle = calculatePopupStyle(this.ctrl.element);
          // apply styles without invoking scope for performance reasons
          angular.element('div.input-popup .dropdown-menu').css(this.popupStyle);
        }
      };

      window.addEventListener('resize', setPopupStyleToElement);

      $scope.$on('$destroy', () => {
        window.removeEventListener('resize', setPopupStyleToElement);
      });
    }
}

interface SelectItemScope extends IRepeatScope, InputPopupScope {
  item: any;
}

mod.directive('inputPopupItemTransclude', () => {
  return {
    link($scope: SelectItemScope, element: JQuery, _attribute: IAttributes, _controller: any, transclude: ITranscludeFunction) {
      transclude((clone, transclusionScope) => {
        transclusionScope![$scope.ctrl.ctrl.popupItemName] = $scope.item;
        element.append(clone!);
      });
    }
  };
});

interface InputPopupItemScope extends IRepeatScope {
  inputPopupSelectItem: InputWithPopupController<any>;
}

mod.directive('inputPopupSelectItem', () => {
  return {
    restrict: 'A',
    scope: {
      inputPopupSelectItem: '='
    },
    link($scope: InputPopupItemScope, element: JQuery) {
      $scope.$watch(() => $scope.inputPopupSelectItem && $scope.inputPopupSelectItem.selectedSelectionIndex, index => {
        if (($scope.$parent as IRepeatScope).$index === index) {
          scrollToElement(element, element.parent());
        }
      });
    }
  };
});
