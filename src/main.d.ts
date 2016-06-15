/// <reference path="../typings/index.d.ts" />
/// <reference path="./vendor/webcola.d.ts" />
/// <reference path="./vendor/jointjs.d.ts" />

interface NodeRequire {
  // Webpack require extension
  ensure(modules: string[], cb: (require: NodeRequire) => void): void
}

interface Window {
  jQuery: JQueryStatic;
  encodeURIComponent: any;
  requestAnimFrame(callback: FrameRequestCallback): number;
  webkitRequestAnimationFrame(callback: FrameRequestCallback): number;
  mozRequestAnimationFrame(callback: FrameRequestCallback): number;
}

declare namespace angular {
  interface INgModelController {
    $options: any;
  }
  interface ITranscludeFunction {
    (cloneAttachFn: ICloneAttachFunction, futureParentElement: JQuery, slotName: string): IAugmentedJQuery;
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

declare module "webpack-merge" {

  import { Configuration } from 'webpack';

  interface WebpackMerge {
    (...configs: Configuration[]): any;
  }

  export default WebpackMerge;
  export const smart: WebpackMerge;
}
