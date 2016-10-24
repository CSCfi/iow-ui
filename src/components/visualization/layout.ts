import { IPromise, IQService, IQResolveReject } from 'angular';
import { Uri } from '../../entities/uri';
import { layout as colaLayout } from './colaLayout';
import * as joint from 'jointjs';
import { ModelPositions } from '../../entities/visualization';

export function layoutGraph($q: IQService, graph: joint.dia.Graph, directed: boolean, onlyNodeIds: Uri[]): IPromise<any> {
  if (directed && onlyNodeIds.length === 0) {
    // TODO directed doesn't support incremental layout

    return $q.when(
      joint.layout.DirectedGraph.layout(graph, {
        nodeSep: 100,
        edgeSep: 150,
        rankSep: 500,
        rankDir: "LR"
      })
    );
  } else {
    return $q((resolve: IQResolveReject<any>, reject: IQResolveReject<any>) => {
      colaLayout(graph, onlyNodeIds.map(id => id.uri))
        .then(() => resolve(), err => reject(err));
    });
  }
}

export function adjustElementLinks(paper: joint.dia.Paper, element: joint.dia.Element, alreadyAdjusted: Set<string>, modelPositions: ModelPositions, vertexAction: VertexAction) {
  const graph = <joint.dia.Graph> paper.model;

  const connectedLinks = graph.getConnectedLinks(<joint.dia.Cell> element);

  for (const link of connectedLinks) {
    if (!alreadyAdjusted.has(link.id) && !!link.get('source').id && !!link.get('target').id) {
      const siblings = connectedLinks.filter(connectedLink => isSiblingLink(link, connectedLink));
      adjustSiblingLinks(paper, siblings, alreadyAdjusted, modelPositions, vertexAction);
    }
  }
}

export enum VertexAction {
  Reset, KeepNormal, KeepAll
}

function adjustSiblingLinks(paper: joint.dia.Paper, siblings: joint.dia.Link[], alreadyAdjusted: Set<string>, modelPositions: ModelPositions, vertexAction: VertexAction) {

  function getLinkPositionVertices(link: joint.dia.Link) {
    const sourcePosition = modelPositions.getClass(new Uri(link.get('source').id, {}));
    return sourcePosition.getAssociationProperty(new Uri(link.get('internalId'), {})).vertices;
  }

  function getPersistedVertices(link: joint.dia.Link, siblingCount: number, isLoop: boolean) {
    if (vertexAction === VertexAction.Reset || (vertexAction === VertexAction.KeepNormal && (siblingCount > 1 || isLoop))) {
      return null;
    } else {
      return getLinkPositionVertices(link);
    }
  }

  const graph = <joint.dia.Graph> paper.model;
  const first = siblings[0];
  const firstSource = first.get('source');
  const loop = isLoop(first);

  for (let i = 0; i < siblings.length; i++) {

    const link = siblings[i];
    const source = (<joint.dia.Element> graph.getCell(link.get('source').id));
    const target = (<joint.dia.Element> graph.getCell(link.get('target').id));
    const persistedVertices = getPersistedVertices(link, siblings.length, loop);

    if (persistedVertices) {
      link.set('vertices', persistedVertices);
    } else if (loop) {
      link.set('vertices', calculateRecurseSiblingVertices(source, i));
    } else if (siblings.length > 1) {
      if (firstSource.id === source.id) {
        link.set('vertices', calculateNormalSiblingVertices(source, target, i));
      } else {
        link.set('vertices', calculateNormalSiblingVertices(target, source, i));
      }
    } else {
      link.unset('vertices');
    }

    if (!loop && siblings.length > 1) {
      const length = (paper.findViewByModel(link) as joint.dia.LinkView).getConnectionLength();
      link.prop('labels/0/position', calculateNormalSiblingLabelPosition(length, firstSource.id !== source.id, i));
    } else {
      link.prop('labels/0/position', 0.5);
    }

    alreadyAdjusted.add(link.id);
  }
}


export function calculateLabelPosition(paper: joint.dia.Paper, graph: joint.dia.Graph, link: joint.dia.Link) {

  const sourceId = link.get('source').id;
  const targetId = link.get('target').id;
  const sourceElement = graph.getCell(sourceId);
  const links = graph.getConnectedLinks(sourceElement);
  const siblings = links.filter(l => l.get('target').id === targetId || l.get('source').id === targetId);

  if (!isLoop(link) && siblings.length > 1) {
    const firstSourceId = siblings[0].get('source').id;
    const indexInSiblings = siblings.indexOf(link);
    const length = (paper.findViewByModel(link) as joint.dia.LinkView).getConnectionLength();
    return calculateNormalSiblingLabelPosition(length, firstSourceId !== sourceId, indexInSiblings);
  } else {
    return 0.5;
  }
}


function calculateNormalSiblingLabelPosition(linkLength: number, inverseDirection: boolean, siblingIndex: number) {
  const sign = siblingIndex % 2 ? 1 : -1;
  const gapBetweenSiblings = 20;
  return (linkLength / 2) + (sign * (inverseDirection ? -1 : 1) * Math.ceil(siblingIndex / 2) * gapBetweenSiblings) + (inverseDirection ? 10 : 0);
}

function calculateNormalSiblingVertices(source: joint.dia.Element, target: joint.dia.Element, siblingIndex: number) {

  const gapBetweenSiblings = 25;

  const srcCenter = source.getBBox().center();
  const trgCenter = target.getBBox().center();
  const midPoint = joint.g.line(srcCenter, trgCenter).midpoint();
  const theta = srcCenter.theta(trgCenter);

  const offset = gapBetweenSiblings * Math.ceil(siblingIndex / 2);
  const sign = siblingIndex % 2 ? 1 : -1;
  const angle = joint.g.toRad(theta + sign * 90);
  const vertex = joint.g.point.fromPolar(offset, angle, midPoint);

  return [vertex];
}

function calculateRecurseSiblingVertices(element: joint.dia.Element, siblingIndex: number) {

  const bbox = element.getBBox();
  const offset = 50;
  const sign = { x: 1, y: 1 };
  const center = joint.g.point(bbox.x + bbox.width / 2 - (sign.x * siblingIndex * 10), bbox.y + bbox.height / 2 - (sign.y * siblingIndex * 10));
  const corner = joint.g.point(center).offset(bbox.width / 2 * sign.x, bbox.height / 2 * sign.y);
  const scale = (siblingIndex + 1) * 0.5;

  return [
    joint.g.point(corner).offset(-sign.x * bbox.width / 4, sign.y * (offset * scale)),
    joint.g.point(corner).offset(sign.x * (offset * scale), sign.y * (offset * scale)),
    joint.g.point(corner).offset(sign.x * (offset * scale), -sign.y * bbox.height / 4)
  ];
}

function isSiblingLink(lhs: joint.dia.Link, rhs: joint.dia.Link) {
  const lhsSource = lhs.get('source').id;
  const lhsTarget = lhs.get('target').id;
  const rhsSource = rhs.get('source').id;
  const rhsTarget = rhs.get('target').id;

  return (lhsSource === rhsSource && lhsTarget === rhsTarget) || (lhsSource === rhsTarget && lhsTarget === rhsSource);
}

function isLoop(link: joint.dia.Link) {
  return link.get('source').id === link.get('target').id;
}
