import { IPromise, IQService, IQResolveReject } from 'angular';
import { Uri } from '../../services/uri';
import { layout as colaLayout } from './colaLayout';
import * as joint from 'jointjs';
import { ModelPositions } from '../../services/entities';

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
      colaLayout(graph, _.map(onlyNodeIds, id => id.uri))
        .then(() => resolve(), err => reject(err));
    });
  }
}

export function adjustElementLinks(paper: joint.dia.Paper, element: joint.dia.Element, alreadyAdjusted: Set<string>, modelPositions: ModelPositions, vertexAction: VertexAction) {
  const graph = <joint.dia.Graph> paper.model;

  const connectedLinks = graph.getConnectedLinks(<joint.dia.Cell> element);

  for (const link of connectedLinks) {
    if (!alreadyAdjusted.has(link.id) && !!link.get('source').id && !!link.get('target').id) {
      const siblings = _.filter(connectedLinks, _.partial(isSiblingLink, link));
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

function calculateNormalSiblingLabelPosition(linkLength: number, inverseDirection: boolean, siblingIndex: number) {
  const sign = siblingIndex % 2 ? 1 : -1;
  const gapBetweenSiblings = 30;
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
  const position = siblingIndex % 4;

  function resolveSign() {
    switch (position) {
      case 0:
        return { x: 1,  y: 1 };
      case 1:
        return { x: -1, y: 1 };
      case 2:
        return { x: 1,  y: -1 };
      case 3:
        return { x: -1, y: -1 };
      default:
        throw new Error('Unsupported position: ' + position);
    }
  }

  const offset = 50;
  const sign = resolveSign();
  const center = joint.g.point(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
  const corner = joint.g.point(center).offset(bbox.width / 2 * sign.x, bbox.height / 2 * sign.y);
  const scale = Math.floor(siblingIndex / 4) + 1;

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
