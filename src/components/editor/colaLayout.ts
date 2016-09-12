import { Layout, Event, EventType, Link, Node } from 'webcola';
import { Iterable } from '../../utils/iterable';
import * as joint from 'jointjs';

const debugPerformance = false;

interface IdentifiedNode extends Node {
  id: string;
  width?: number;
  height?: number;
  fixed: boolean;
}

class SimpleColaLayout extends Layout {

  tickCount = 0;

  constructor(nodes: IdentifiedNode[], links: Link<IdentifiedNode>[], allNodes: boolean, private ready: () => void) {
    super();

    if (debugPerformance) {
      console.time('initial');
    }

    this.nodes(nodes);
    this.links(links);

    this.avoidOverlaps(false);
    this.handleDisconnected(true);
    this.jaccardLinkLengths(allNodes ? 30 : 300);
    this.convergenceThreshold(0.005);
  }

  trigger(e: Event): void {
    switch (e.type) {
      case EventType.end:
        this.ready();
        break;
      case EventType.start:
      case EventType.tick:
        break;
      default:
        throw new Error('Unknown event');
    }
  }

  kick() {

    if (debugPerformance && this.tickCount === 0) {
      console.timeEnd('initial');
      console.time('async');
    }

    window.requestAnimFrame(() => {
      this.tickCount++;
      if (!this.tick()) {
        this.kick();
      } else if (debugPerformance) {
        console.timeEnd('async');
      }
    });
  }

  drag() {
  }

  on(e: EventType | string, listener: (event: Event) => void): Layout {
    return super.on(e, listener);
  }
}

function index<T extends {id: string}>(items: T[]): Map<string, T> {
  function withId(item: T): [string, T] {
    return [item.id, item];
  }
  return new Map<string, T>(items.map(withId));
}


const scaleCorrection = 15;

function hash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
  }
  return hash % 47;
}

export function layout(graph: joint.dia.Graph, onlyNodeIds: string[] = []): Promise<any> {

  const nodes: Map<string, IdentifiedNode> = new Map<string, IdentifiedNode>();
  const links: Link<IdentifiedNode>[] = [];
  const jointElements = index(graph.getElements());
  const onlyNodeIdsSet = new Set<string>(onlyNodeIds);

  Iterable.forEach(jointElements.values(), element => {
    nodes.set(element.id, {
      id: element.id,
      x: (element.attributes.position.x || hash('x' + element.id)),
      y: (element.attributes.position.y || hash('y' + element.id)),
      width: element.attributes.size.width / scaleCorrection,
      height: element.attributes.size.height / scaleCorrection,
      fixed: onlyNodeIdsSet.size > 0 && !onlyNodeIdsSet.has(element.id)
    });
  });

  for (const link of graph.getLinks()) {
    links.push({
      source: nodes.get(link.attributes.source.id),
      target: nodes.get(link.attributes.target.id)
    });
  }

  function findMin(iterable: Iterable<IdentifiedNode>) {
    const iterator = iterable[Symbol.iterator]();

    let minX: number = null;
    let minY: number = null;

    for (let next = iterator.next(); next.value !== undefined; next = iterator.next()) {
      if (!minX || next.value.x < minX) {
        minX = next.value.x;
      }
      if (!minY || next.value.y < minY) {
        minY = next.value.y;
      }
    }

    return { x: minX, y: minY };
  }

  return new Promise((resolve) => {
    const layout = new SimpleColaLayout(Array.from(nodes.values()), links, onlyNodeIds.length === 0, () => {

      if (onlyNodeIds.length > 0) {
        for (const nodeId of onlyNodeIds) {
          const node = nodes.get(nodeId);
          const element = jointElements.get(nodeId);
          element.position(node.x, node.y);
        }
      } else {
        const min = findMin(nodes.values());

        Iterable.forEach(nodes.values(), node => {
          const element = jointElements.get(node.id);
          const normalizedX = (node.x - min.x) * scaleCorrection;
          const normalizedY = (node.y - min.y) * scaleCorrection;
          element.position(normalizedX, normalizedY);
        });
      }
      resolve(layout.tickCount);
    });

    layout.start(30, 0, 30, 0);
  });
}
