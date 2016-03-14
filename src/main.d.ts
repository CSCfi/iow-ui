/// <reference path="../typings/browser.d.ts" />
/// <reference path="./vendor/webcola.d.ts" />
/// <reference path="./vendor/jointjs.d.ts" />

interface NodeRequire {
  // Webpack require extension
  ensure(modules: string[], cb: (require: NodeRequire) => void): void
}

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
