import { Layout, Event, EventType, Link, Node } from 'webcola';
import Cell = joint.dia.Cell;
import IPromise = angular.IPromise;

interface IdentifiedNode extends Node {
  id: string;
  width?: number;
  height?: number;
}

export type Dimensions = { width: number, height: number };

class SimpleColaLayout extends Layout {

  constructor(nodes: IdentifiedNode[], links: Link<IdentifiedNode>[], canvasSize: Dimensions, private ready: () => void) {
    super();

    this.nodes(nodes);
    this.links(links);

    this.avoidOverlaps(true);
    this.handleDisconnected(true);
    this.size([canvasSize.width, canvasSize.height]);
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
    while(!this.tick()) {}
  }

  drag() {
  }

  on(e: EventType | string, listener: (event: Event) => void): Layout {
    return super.on(e, listener);
  }
}

function extractCells<T extends joint.dia.Cell>(graph: joint.dia.Graph, filter: (cell: joint.dia.Cell) => boolean): T[] {

  const result: T[] = [];

  graph.get('cells').each(cell => {
    if (filter(cell)) {
      result.push(<T> cell);
    }
  });

  return result;
}

function index<T extends {id: string}>(items: T[]): Map<string, T> {
  function withId(item: T): [string, T] {
    return [item.id, item];
  }
  return new Map<string, T>(items.map(withId));
}


const coordinateRatio = 1/8;
const padding = 15;

export function layout(graph: joint.dia.Graph, canvasSize: Dimensions): Promise<any> {

  const nodes: Map<string, IdentifiedNode> = new Map<string, IdentifiedNode>();
  const links: Link<IdentifiedNode>[] = [];

  const jointElements = index(extractCells<joint.dia.Element>(graph, (cell) => !cell.isLink()));
  const jointLinks = extractCells<joint.dia.Link>(graph, (cell) => cell.isLink());

  for (const element of Array.from(jointElements.values())) {
    nodes.set(element.id, {
      id: element.id,
      x: 0,
      y: 0,
      width: element.attributes.size.width * coordinateRatio,
      height: element.attributes.size.height * coordinateRatio
    });
  }

  for (const link of jointLinks) {
    links.push({
      source: nodes.get(link.attributes.source.id),
      target: nodes.get(link.attributes.target.id)
    });
  }

  return new Promise((resolve) => {
    const layout = new SimpleColaLayout(Array.from(nodes.values()), links, canvasSize, () => {
      for (const node of Array.from(nodes.values())) {
        const element = jointElements.get(node.id);
        const x = (node.x - canvasSize.width / 2) * padding;
        const y = (node.y - canvasSize.height / 2) * padding;
        element.position(x, y);
      }
      resolve();
    });

    layout.start();
  });
}
