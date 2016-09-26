import * as joint from 'jointjs';
import { FocusLevel } from '../../services/sessionService';

export const minScale = 0.02;
export const maxScale = 3;

const backgroundClass = 'background';
const selectedClass = 'selected';

export function moveOrigin(paper: joint.dia.Paper, dx: number, dy: number) {
  const oldOrigin = paper.options.origin;
  paper.setOrigin(oldOrigin.x - dx, oldOrigin.y - dy);
}

export function getScale(paper: joint.dia.Paper) {
  const viewport = joint.V(paper.viewport);
  return viewport.scale().sx;
}

export function scale(paper: joint.dia.Paper, scaleDiff: number, x?: number, y?: number) {
  const scale = getScale(paper);
  const newScale = scale + scaleDiff;

  if (scale !== newScale && newScale >= minScale && newScale <= maxScale) {
    const scaleRatio = newScale / scale;

    const actualX = x || paper.options.width / 2;
    const actualY = y || paper.options.height / 2;

    const tx = scaleRatio * (paper.options.origin.x - actualX) + actualX;
    const ty = scaleRatio * (paper.options.origin.y - actualY) + actualY;

    paper.setOrigin(tx, ty);
    paper.scale(newScale, newScale);
  }
}

export function centerToElement(paper: joint.dia.Paper, element: joint.dia.Element) {
  const scale = 0.8;
  const bbox = element.getBBox();
  const x = (paper.options.width / 2) - (bbox.x + bbox.width / 2) * scale;
  const y = (paper.options.height / 2) - (bbox.y + bbox.height / 2) * scale;

  paper.scale(scale);
  paper.setOrigin(x, y);
}

enum Direction {
  INCOMING,
  OUTGOING,
  BOTH
}

export function focusElement(paper: joint.dia.Paper, graph: joint.dia.Graph, element: joint.dia.Element, forceFitToAllContent: boolean, selectionFocus: FocusLevel) {

  function resetFocusOnAllCells() {
    for (const cell of graph.getCells()) {
      const jqueryElement = joint.V(paper.findViewByModel(cell).el);

      jqueryElement.removeClass(selectedClass);

      if (element && selectionFocus !== FocusLevel.ALL) {
        jqueryElement.addClass(backgroundClass);
      } else {
        jqueryElement.removeClass(backgroundClass);
      }
    }
  }

  function applyFocus(e: joint.dia.Element, direction: Direction, depth: number, visitedOutgoing: Set<joint.dia.Element>, visitedIncoming: Set<joint.dia.Element>) {

    if (selectionFocus === FocusLevel.ALL) {
      return;
    }

    const optionsOutgoing = { outbound: true, inbound: false };
    const optionsIncoming = { outbound: false, inbound: true };

    joint.V(paper.findViewByModel(e).el).removeClass(backgroundClass);

    if (selectionFocus === FocusLevel.INFINITE_DEPTH || depth <= selectionFocus) {

      if (direction === Direction.INCOMING || direction === Direction.BOTH) {

        for (const association of graph.getConnectedLinks(<joint.dia.Cell> e, optionsIncoming)) {
          joint.V(paper.findViewByModel(association).el).removeClass(backgroundClass);
        }

        for (const klass of graph.getNeighbors(e, optionsIncoming)) {
          if (!visitedIncoming.has(klass)) {
            visitedIncoming.add(klass);
            applyFocus(klass, Direction.INCOMING, depth + 1, visitedOutgoing, visitedIncoming);
          }
        }
      }

      if (direction === Direction.OUTGOING || direction === Direction.BOTH) {

        for (const association of graph.getConnectedLinks(<joint.dia.Cell> e, optionsOutgoing)) {
          joint.V(paper.findViewByModel(association).el).removeClass(backgroundClass);
        }

        for (const klass of graph.getNeighbors(e, optionsOutgoing)) {
          if (!visitedOutgoing.has(klass)) {
            visitedOutgoing.add(klass);
            applyFocus(klass, Direction.OUTGOING, depth + 1, visitedOutgoing, visitedIncoming);
          }
        }
      }
    }
  }

  resetFocusOnAllCells();

  if (element) {
    applyFocus(element, Direction.BOTH, 1, new Set<joint.dia.Element>(), new Set<joint.dia.Element>());
    joint.V(paper.findViewByModel(element).el).addClass(selectedClass);
  }

  if (forceFitToAllContent) {
    scaleToFit(paper, graph, false);
  } else if (element) {
    if (selectionFocus === FocusLevel.ALL) {
      centerToElement(paper, element);
    } else {
      scaleToFit(paper, graph, true);
    }
  } else {
    scaleToFit(paper, graph, true);
  }
}

export function scaleToFit(paper: joint.dia.Paper, graph: joint.dia.Graph, onlyVisible: boolean) {

  function isVisible(modelOrId: Element|string) {
    return !joint.V(paper.findViewByModel(modelOrId).el).hasClass(backgroundClass);
  }

  function getContentBBox(elements: joint.dia.Element[]) {

    if (elements.length === 0) {
      return paper.getContentBBox();
    }

    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    function applyBBox(bbox: { x: number; y: number; width: number; height: number; }) {
      minX = Math.min(minX, (bbox.x));
      minY = Math.min(minY, (bbox.y));
      maxX = Math.max(maxX, (bbox.x + bbox.width));
      maxY = Math.max(maxY, (bbox.y + bbox.height));
    }

    for (const element of elements) {

      applyBBox(paper.findViewByModel(element).getBBox());

      for (const link of graph.getConnectedLinks(element)) {
        if (isVisible(link.get('source').id) && isVisible(link.get('target').id)) {
          applyBBox(paper.findViewByModel(link).getBBox());
        }
      }
    }

    return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
  }

  const visibleElements = !onlyVisible ? [] : _.filter(graph.getElements(), isVisible);
  const scale = getScale(paper);
  const padding = 45;

  const contentBBox = getContentBBox(visibleElements);
  const fittingBBox = {
    x: paper.options.origin.x + padding,
    y: paper.options.origin.y + padding,
    width: paper.options.width - padding * 2,
    height: paper.options.height - padding * 2
  };

  const newScale = Math.min(fittingBBox.width / contentBBox.width * scale, fittingBBox.height / contentBBox.height * scale);

  paper.scale(Math.max(Math.min(newScale, maxScale), minScale));
  const contentBBoxAfterScaling = getContentBBox(visibleElements);

  const newOx = fittingBBox.x - contentBBoxAfterScaling.x;
  const newOy = fittingBBox.y - contentBBoxAfterScaling.y;

  paper.setOrigin(newOx, newOy);
}
