import IAttributes = angular.IAttributes;
import IRepeatScope = angular.IRepeatScope;
import IScope = angular.IScope;
import { resetWith, moveElement } from '../../services/utils';
import { module as mod }  from './module';

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

      element.attr('draggable', 'true');

      $scope.$watch(() => dragSortable.drag, drag => {
        const dragReady = drag ? drag.cloneCreated : false;
        element.toggleClass('dragged', dragReady && drag.fromIndex === $scope.$index);
        element.toggleClass('droppable', dragReady && drag.droppable);
      }, true);

      element.on('selectstart', function() { this.dragDrop(); } ); // IE9 support hack
      element.on('dragstart', event => $scope.$apply(() => dragSortable.startDrag((<DragEvent> event.originalEvent).dataTransfer, $scope.$index, element.width())));
      element.on('dragend', event => $scope.$apply(() => dragSortable.drop()));
      element.on('dragover', event => {
        if (dragSortable.drag) {
          event.preventDefault();

          const originalEvent = (<DragEvent> event.originalEvent);
          const mousePosition = originalEvent.clientX - element.offset().left;

          $scope.$apply(() => dragSortable.overDroppable($scope.$index, element.width(), mousePosition));
        }
      });
      element.on('dragleave', event => $scope.$apply(() => dragSortable.notOverDroppable()));
      element.on('dragenter', event => $scope.$apply(() => dragSortable.cloneCreated()));
      element.on('drop', event => {
        event.preventDefault();
        $scope.$apply(() => dragSortable.drop());
      });
    }
  };
});
