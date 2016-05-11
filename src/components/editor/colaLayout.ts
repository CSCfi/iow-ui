import { Layout, Event, EventType, Link, Node } from 'webcola';
import { Iterable } from '../../utils/iterable';

interface IdentifiedNode extends Node {
  id: string;
  width?: number;
  height?: number;
}

class SimpleColaLayout extends Layout {

  tickCount = 0;

  constructor(nodes: IdentifiedNode[], links: Link<IdentifiedNode>[], private ready: () => void) {
    super();

    this.nodes(nodes);
    this.links(links);

    this.avoidOverlaps(true);
    this.handleDisconnected(true);
    this.jaccardLinkLengths(30);
    this.convergenceThreshold(0.02);
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
    window.requestAnimFrame(() => {
      this.tickCount++;
      if (!this.tick()) {
        this.kick();
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


const coordinateRatio = 1 / 8;
const padding = 15;

function hash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
  }
  return hash % 47;
}

export function layout(graph: joint.dia.Graph): Promise<any> {

  const nodes: Map<string, IdentifiedNode> = new Map<string, IdentifiedNode>();
  const links: Link<IdentifiedNode>[] = [];
  const jointElements = index(graph.getElements());

  Iterable.forEach(jointElements.values(), element => {
    nodes.set(element.id, {
      id: element.id,
      x: element.attributes.position.x * coordinateRatio || hash(element.id + 'x'),
      y: element.attributes.position.y * coordinateRatio || hash(element.id + 'y'),
      width: element.attributes.size.width * coordinateRatio,
      height: element.attributes.size.height * coordinateRatio
    });
  });

  for (const link of graph.getLinks()) {
    links.push({
      source: nodes.get(link.attributes.source.id),
      target: nodes.get(link.attributes.target.id)
    });
  }

  function setNewPosition(node: IdentifiedNode, element: joint.dia.Element, min: {x: number, y: number}) {
    const x = (node.x - min.x) * padding;
    const y = (node.y - min.y) * padding;
    element.position(x, y);
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
    const layout = new SimpleColaLayout(Array.from(nodes.values()), links, () => {
      const min = findMin(nodes.values());
      Iterable.forEach(nodes.values(), node => setNewPosition(node, jointElements.get(node.id), min));
      resolve(layout.tickCount);
    });

    layout.start(20, 0, 20, 0);
  });
}
