/// <reference path="../typings/tsd.d.ts" />

import IControllerService = angular.IControllerService;

interface Window {
  jQuery: JQueryStatic;
  encodeURIComponent: any;
}

declare module Twitter.Typeahead {
  interface Dataset {
    limit?: number;
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
    }

    class Cell {
    }

    class Element extends Cell {
    }

    class Link extends Cell {
      constructor(options: any);
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
