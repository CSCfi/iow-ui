/// <reference path="../typings/browser.d.ts" />
/// <reference path="./vendor/webcola.d.ts" />

interface Window {
  jQuery: JQueryStatic;
  encodeURIComponent: any;
}

declare module Twitter.Typeahead {
  interface Dataset {
    limit?: number;
    display?: string | ((obj: any) => string);
  }
}

declare module angular {
  interface INgModelController {
    $options: any;
  }
}

interface MousewheelEvent extends JQueryEventObject {
  deltaFactor: number;
  deltaX: number;
  deltaY: number;
}

interface JQuery {
  mousewheel(handler: (eventObject: MousewheelEvent) => any): JQuery;
  controller(name: string): any;
}

declare module joint {

  module dia {

    class Graph {
      clear(): void;
      addCell(cell: Cell): void;
      get(name: string): Cell;
    }

    class Cell {
      isLink(): boolean;
      each(callback: (cell: Cell) => void): void;
    }

    class Element extends Cell {
      id: string;
      position(x: number, y: number): void;
      attributes: {
        size: { height: number, width: number };
      };
    }

    class Link extends Cell {
      constructor(options: any);
      attributes: {
        source: { id: string };
        target: { id: string };
      }
    }

    class Paper {
      constructor(options: any);

      viewport: any;
      scaleContentToFit(options: any): void;
      setOrigin(x: number, y: number): void;
      on(event: string, callback: (event: any) => void): void;
      scale(x: number, y: number): void;
      setDimensions(width: number, height: number): void;
    }

    module shapes.uml {
      class Class extends joint.dia.Element {
        constructor(options: any);
      }
    }
  }

  module layout {
    class DirectedGraph {
      static layout(graph: joint.dia.Graph, options: any): void;
    }
  }
}
