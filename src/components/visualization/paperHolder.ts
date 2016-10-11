import { IowClassElement, ShadowClass } from './diagram';
import * as joint from 'jointjs';
import { ClassInteractionListener } from './contract';
import { Iterable } from '../../utils/iterable';
import { moveOrigin, scale } from './paperUtil';
import { Model } from '../../entities/model';

export class PaperHolder {

  private cache = new Map<string, { element: JQuery, paper: joint.dia.Paper }>();

  constructor(private element: JQuery, private listener: ClassInteractionListener) {
  }

  getPaper(model: Model): joint.dia.Paper {

    const createPaperAndRegisterHandlers = (element: JQuery) => {
      const paper = createPaper(element, new joint.dia.Graph);
      registerHandlers(paper, this.listener);
      return paper;
    };

    const cached = this.cache.get(model.id.uri);

    if (cached) {
      return cached.paper;
    } else {
      const newElement = jQuery(document.createElement('div'));
      this.element.append(newElement);
      const newPaper = createPaperAndRegisterHandlers(newElement);
      this.cache.set(model.id.uri, { element: newElement, paper: newPaper });
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

function registerHandlers(paper: joint.dia.Paper, listener: ClassInteractionListener) {

  let movingElementOrVertex = false;
  let drag: {x: number, y: number}|null;
  let mouse: {x: number, y: number};

  paper.on('blank:pointerdown', () => drag = mouse);

  jQuery(window).mouseup(() => {
    drag = null;
    movingElementOrVertex = false;
  });

  jQuery(window).mousemove(event => {

    mouse = { x: event.pageX, y: event.pageY};

    if (drag) {
      event.preventDefault();
      moveOrigin(paper, drag.x - mouse.x, drag.y - mouse.y);
      drag = mouse;
    }
  });

  jQuery(paper.$el).mousewheel(event => {
    event.preventDefault();
    scale(paper, (event.deltaY * event.deltaFactor / 500), event.offsetX, event.offsetY);
  });

  paper.on('cell:pointerdown', () => movingElementOrVertex = true);

  paper.on('cell:pointerclick', (cellView: joint.dia.CellView) => {
    const cell: joint.dia.Cell = cellView.model;
    if (cell instanceof joint.shapes.uml.Class && !(cell instanceof ShadowClass)) {
      listener.onClassClick(cell.id);
    }
  });

  paper.on('cell:mouseover', (cellView: joint.dia.CellView, event: MouseEvent) => {
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
  });

  paper.on('cell:mouseout', () => {
    listener.onHoverExit();
  });
}
