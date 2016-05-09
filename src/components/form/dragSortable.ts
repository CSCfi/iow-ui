import IAttributes = angular.IAttributes;
import IRepeatScope = angular.IRepeatScope;
import IScope = angular.IScope;
import { resetWith, moveElement } from '../../services/utils';
import { module as mod }  from './module';

interface DragSortableAttributes extends IAttributes {
  dragSortable: string;
  dragDisabled: string;
}

mod.directive('dragSortable', () => {
  return {
    controller: DragSortableController,
    require: 'dragSortable',
    link($scope: IScope, element: JQuery, attributes: DragSortableAttributes, thisController: DragSortableController) {
      $scope.$watch(attributes.dragSortable, (values: any[]) => thisController.dragValues = values);
      $scope.$watch(attributes.dragDisabled, (disabled: boolean) => thisController.dragDisabled = disabled);
    }
  };
});

class DragSortableController {

  drag: Drag;
  dragDisabled: boolean;
  dragValuesOriginal: any[];
  dragValues: any[];

  startDrag(dataTransfer: DataTransfer, fromIndex: number, sourceWidth: number): void {
    dataTransfer.setData('text', '');
    dataTransfer.dropEffect = 'move';
    dataTransfer.effectAllowed = 'move';

    this.drag = { fromIndex, droppable: true, cloneCreated: false, sourceWidth };
    this.dragValuesOriginal = this.dragValues.slice();
  }

  cloneCreated() {
    this.drag.cloneCreated = true;
  }

  overDroppable(index: number, targetWidth: number, mousePosition: number) {

    const sourceWidth = this.drag.sourceWidth;
    const toLeft = index < this.drag.fromIndex;
    const stableDropRegion = toLeft ? mousePosition < sourceWidth : mousePosition > targetWidth - sourceWidth;

    if (stableDropRegion) {
      this.drag.droppable = true;
      if (this.canDrop(index)) {

        moveElement(this.dragValues, this.drag.fromIndex, index);
        this.drag.fromIndex = index;
      }
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
      resetWith(this.dragValues, this.dragValuesOriginal);
    }
    this.drag = null;
    this.dragValuesOriginal = null;
  }
}

interface Drag {
  fromIndex: number;
  droppable: boolean;
  cloneCreated: boolean;
  sourceWidth: number;
}

mod.directive('dragSortableItem', () => {
  return {
    require: '^dragSortable',
    link($scope: IRepeatScope, element: JQuery, attributes: IAttributes, dragSortable: DragSortableController) {

      const selectStartHandler = function() { this.dragDrop(); }; // IE9 support hack
      const dragStartHandler = (event: JQueryMouseEventObject) => $scope.$apply(() => dragSortable.startDrag((<DragEvent> event.originalEvent).dataTransfer, $scope.$index, element.width()));
      const dragEndHandler = (event: JQueryMouseEventObject) => $scope.$apply(() => dragSortable.drop());
      const dragOverHandler = (event: JQueryMouseEventObject) => {
        if (dragSortable.drag) {
          event.preventDefault();

          const originalEvent = (<DragEvent> event.originalEvent);
          const mousePosition = originalEvent.clientX - element.offset().left;

          $scope.$apply(() => dragSortable.overDroppable($scope.$index, element.width(), mousePosition));
        }
      };
      const dragLeaveHandler = (event: JQueryMouseEventObject) => $scope.$apply(() => dragSortable.notOverDroppable());
      const dragEnterHandler = (event: JQueryMouseEventObject) => $scope.$apply(() => dragSortable.cloneCreated());
      const dropHandler = (event: JQueryMouseEventObject) => {
        event.preventDefault();
        $scope.$apply(() => dragSortable.drop());
      };

      $scope.$watch(() => dragSortable.drag, drag => {
        const dragReady = drag ? drag.cloneCreated : false;
        element.toggleClass('dragged', dragReady && drag.fromIndex === $scope.$index);
        element.toggleClass('droppable', dragReady && drag.droppable);
      }, true);

      function init() {
        element.attr('draggable', 'true');
        element.on('selectstart', selectStartHandler);
        element.on('dragstart', dragStartHandler);
        element.on('dragend', dragEndHandler);
        element.on('dragover', dragOverHandler);
        element.on('dragleave', dragLeaveHandler);
        element.on('dragenter', dragEnterHandler);
        element.on('drop', dropHandler);
      }

      function release() {
        element.attr('draggable', 'false');
        element.off('selectstart', selectStartHandler);
        element.off('dragstart', dragStartHandler);
        element.off('dragend', dragEndHandler);
        element.off('dragover', dragOverHandler);
        element.off('dragleave', dragLeaveHandler);
        element.off('dragenter', dragEnterHandler);
        element.off('drop', dropHandler);
      }

      $scope.$watch(() => dragSortable.dragDisabled, disabled => {
        if (disabled) {
          release();
        } else {
          init();
        }
      });

      $scope.$on('destroy', release);
    }
  };
});
