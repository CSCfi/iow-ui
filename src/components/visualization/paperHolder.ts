import { IowClassElement, ShadowClass } from './diagram';
import * as joint from 'jointjs';
import { ClassInteractionListener } from './contract';
import { Iterable } from '../../utils/iterable';
import { moveOrigin, scale } from './paperUtil';
import { Model } from '../../entities/model';
import { Coordinate } from '../../entities/contract';
import { Optional } from '../../utils/object';

interface Cached {
  element: JQuery;
  paper: joint.dia.Paper;
  clean: () => void;
}

interface Cleanable {
  clean(): void;
}

export class PaperHolder implements Cleanable {

  private cache = new Map<string, Cached>();

  constructor(private element: JQuery, private listener: ClassInteractionListener) {
  }

  getPaper(model: Model): joint.dia.Paper {

    const cached = this.cache.get(model.id.uri);

    if (cached) {
      return cached.paper;
    } else {
      const newElement = jQuery(document.createElement('div'));
      this.element.append(newElement);
      const newPaper = createPaper(newElement, new joint.dia.Graph);
      const cleanable = registerHandlers(newPaper, this.listener);
      this.cache.set(model.id.uri, { element: newElement, paper: newPaper, clean: () => cleanable.clean() });
      return newPaper;
    }
  }

  setVisible(model: Model) {
    Iterable.forEach(this.cache.entries(), ([modelId, value]) => {
      if (model.id.uri === modelId) {
        value.element.show();
      } else {
        value.element.hide();
      }
    });
  }

  clean() {
    for (const cached of Array.from(this.cache.values())) {
      cached.clean();
    }
  }
}

function createPaper(element: JQuery, graph: joint.dia.Graph): joint.dia.Paper {
  return new joint.dia.Paper({
    el: element,
    width: element.width() || 100,
    height: element.height() || 100,
    model: graph,
    linkPinning: false,
    snapLinks: false,
    perpendicularLinks: true
  });
}

function registerHandlers(paper: joint.dia.Paper, listener: ClassInteractionListener): Cleanable {

  const paperElement = paper.$el;
  let movingElementOrVertex = false;
  let drag: {x: number, y: number}|null;
  let mouse: {x: number, y: number};
  let showMenu: Optional<string>;

  const startDragHandler = () => drag = mouse;

  const stopDragHandler = () => {
    drag = null;
    movingElementOrVertex = false;
  };

  const dragMoveHandler = (event: MouseEvent) => {

    mouse = { x: event.pageX, y: event.pageY};

    if (drag) {
      event.preventDefault();
      moveOrigin(paper, drag.x - mouse.x, drag.y - mouse.y);
      drag = mouse;
    }
  };

  const mouseWheelHandler = (event: MousewheelEvent) => {
    event.preventDefault();
    scale(paper, (event.deltaY * event.deltaFactor / 500), event.offsetX, event.offsetY);
  };

  const startCellMoveHandler = () => movingElementOrVertex = true;

  const classClickHandler = (cellView: joint.dia.CellView) => {
    const cell: joint.dia.Cell = cellView.model;
    if (cell instanceof joint.shapes.uml.Class && !(cell instanceof ShadowClass)) {
      listener.onClassClick(cell.id);
    }
  };

  const hoverHandler = (cellView: joint.dia.CellView, event: MouseEvent) => {
    if (!drag && !movingElementOrVertex && event.target instanceof SVGElement) {

      const targetElement = jQuery(event.target);
      const targetParentElement = targetElement.parent();

      if (targetElement.prop('tagName') === 'tspan') {
        if (cellView.model instanceof IowClassElement && targetElement.attr('id').startsWith('urn:uuid')) {
          listener.onPropertyHover(cellView.model.id, targetElement.attr('id'), { x: event.pageX, y: event.pageY });
        } else if (cellView.model instanceof joint.dia.Link && targetParentElement.attr('id').startsWith('urn:uuid')) {
          listener.onPropertyHover(cellView.model.get('source').id, targetParentElement.attr('id'), { x: event.pageX, y: event.pageY });
        } else if (cellView.model instanceof IowClassElement && targetParentElement.hasClass('uml-class-name-text')) {
          listener.onClassHover(cellView.model.id, { x: event.pageX, y: event.pageY });
        }
      }
    }
  };

  const hoverExitHandler = () => listener.onHoverExit();

  const prepareShowContextMenuHandler = (e: JQueryEventObject) => {
    const location = clientToPaperLocation(paper, clientToOffsetCoordinate(paper, e));
    const views = paper.findViewsFromPoint(location);

    if (views.length > 0) {
      showMenu = views[0].model.id;
    } else {
      listener.onDismissContextMenu();
      showMenu = null;
    }
  };

  const cancelShowMenuHandler = () => showMenu = null;

  const showContextMenuHandler = (e: JQueryEventObject) => {
    if (showMenu) {
      listener.onClassContextMenu(showMenu, clientToOffsetCoordinate(paper, e));
    }
  };

  const hideContextMenuHandler = () => {
    listener.onDismissContextMenu();
    showMenu = null;
  };

  paper.on('blank:pointerdown', startDragHandler);
  window.addEventListener('mouseup', stopDragHandler);
  window.addEventListener('mousemove', dragMoveHandler);
  angular.element(paperElement).mousewheel(mouseWheelHandler);
  paper.on('cell:pointerdown', startCellMoveHandler);
  paper.on('cell:pointerclick', classClickHandler);
  paper.on('cell:mouseover', hoverHandler);
  paper.on('cell:mouseout', hoverExitHandler);
  paperElement.on('contextmenu', prepareShowContextMenuHandler);
  paperElement.on('mousemove', cancelShowMenuHandler);
  paperElement.on('mouseup', showContextMenuHandler);
  paperElement.on('click', hideContextMenuHandler);

  return {
    clean() {
      paper.remove();
      window.removeEventListener('mouseup', stopDragHandler);
      window.removeEventListener('mousemove', dragMoveHandler);
    }
  };
}

function clientToOffsetCoordinate(paper: joint.dia.Paper, event: JQueryEventObject) {
  const paperOffset = paper.$el.offset();
  return { x: event.clientX - paperOffset.left, y: event.clientY - paperOffset.top };
}

function clientToPaperLocation(paper: joint.dia.Paper, offsetCoordinate: Coordinate): Coordinate {
  const svgPoint: SVGPoint = (paper as any).svg.createSVGPoint();
  svgPoint.x = offsetCoordinate.x;
  svgPoint.y = offsetCoordinate.y;
  return svgPoint.matrixTransform(paper.viewport.getCTM().inverse());
}
