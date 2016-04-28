import IAttributes = angular.IAttributes;
import { module as mod }  from './module';
import IScope = angular.IScope;
import { resetWith, moveElement } from '../../services/utils';
import IRepeatScope = angular.IRepeatScope;

interface DragSortableAttributes extends IAttributes {
  dragSortable: string;
}

mod.directive('dragSortable', () => {
  return {
    controller: DragSortableController,
    require: 'dragSortable',
    link($scope: IScope, element: JQuery, attributes: DragSortableAttributes, thisController: DragSortableController) {
      $scope.$watch(attributes.dragSortable, (values: any[]) => thisController.dragValues = values);
    }
  };
});

class DragSortableController {

  drag: Drag;
  dragValues: any[];

  startDrag(dataTransfer: DataTransfer, fromIndex: number): void {
    dataTransfer.setData('text', '');
    dataTransfer.dropEffect = 'move';
    dataTransfer.effectAllowed = 'move';

    this.drag = new Drag(fromIndex, this.dragValues);
  }

  overDroppable(index: number) {
    this.drag.droppable = true;
    if (this.canDrop(index)) {
      moveElement(this.dragValues, this.drag.fromIndex, index);
      this.drag.fromIndex = index;
    }
  }

  notOverDroppable() {
    this.drag.droppable = false;
  }

  canDrop(index: number) {
    return this.drag.fromIndex !== index;
  }

  drop() {
    if (this.drag && !this.drag.droppable) {
      resetWith(this.dragValues, this.drag.copyOfOriginal);
    }
    this.drag = null;
  }
}

class Drag {

  droppable: boolean = true;
  copyOfOriginal: any[];

  constructor(public fromIndex: number, private originalArray: any[]) {
    this.copyOfOriginal = originalArray.slice();
  }
}

mod.directive('dragSortableItem', () => {
  return {
    require: '^dragSortable',
    link($scope: IRepeatScope, element: JQuery, attributes: IAttributes, dragSortable: DragSortableController) {

      element.attr('draggable', 'true');

      $scope.$watchGroup([() => dragSortable.drag && dragSortable.drag.fromIndex, () => dragSortable.drag && dragSortable.drag.droppable], ([fromIndex, droppable]) => {

        // timeout is needed so that browser drag api copies original image as shadow

        if (fromIndex === $scope.$index) {
          window.setTimeout(() => element.addClass('dragged'), 0);
        } else {
          element.removeClass('dragged');
        }

        if (droppable) {
          window.setTimeout(() => element.addClass('droppable'), 0);
        } else {
          element.removeClass('droppable');
        }
      });

      element.on('dragstart', event => $scope.$apply(() => dragSortable.startDrag((<DragEvent> event.originalEvent).dataTransfer, $scope.$index)));
      element.on('dragend', event => $scope.$apply(() => dragSortable.drop()));
      element.on('dragover', event => {
        if (dragSortable.drag) {
          event.preventDefault();
          $scope.$apply(() => dragSortable.overDroppable($scope.$index));
        }
      });
      element.on('dragleave', event => $scope.$apply(() => dragSortable.notOverDroppable()));
      element.on('drop', event => {
        event.preventDefault();
        $scope.$apply(() => dragSortable.drop());
      });
    }
  };
});
