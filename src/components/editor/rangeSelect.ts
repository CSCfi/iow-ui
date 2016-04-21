import { dataTypes, DataType } from '../../services/dataTypes';
import { module as mod }  from './module';

mod.directive('rangeSelect', () => {
  return {
    scope: {
      range: '=',
      id: '@'
    },
    restrict: 'E',
    template: '<localized-select id="{{ctrl.id}}" values="ctrl.ranges" value="ctrl.range"></localized-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller: RangeSelectController
  };
});

class RangeSelectController {
  range: DataType;
  ranges: DataType[] = dataTypes;
}
