/// <reference path="../node_modules/@types/jointjs/index.d.ts" />

import { IAugmentedJQuery, ICloneAttachFunction } from 'angular';

declare global {

  interface Window {
    jQuery: JQueryStatic;
    encodeURIComponent: any;
    requestAnimFrame(callback: FrameRequestCallback): number;
    webkitRequestAnimationFrame(callback: FrameRequestCallback): number;
    mozRequestAnimationFrame(callback: FrameRequestCallback): number;
  }

  interface Error {
    stack?: string;
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

  const process: { env: any };
}

declare module 'angular' {
  interface INgModelController {
    $options: any;
  }

  interface ITranscludeFunction {
    (cloneAttachFn: ICloneAttachFunction, futureParentElement: JQuery, slotName: string): IAugmentedJQuery;
  }
}
