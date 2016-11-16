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

  interface CSS {
    escape(str: string): string;
  }

  const process: { env: any };

  interface WebpackRequireEnsureCallback {
    (req: WebpackRequire): void
  }

  interface WebpackRequire {
    (id: string): any;
    (paths: string[], callback: (...modules: any[]) => void): void;
    ensure(ids: string[], callback: WebpackRequireEnsureCallback, chunkName?: string): void;
    context(directory: string, useSubDirectories?: boolean, regExp?: RegExp): WebpackContext;
  }

  interface WebpackContext extends WebpackRequire {
    keys(): string[];
  }

  const require: WebpackRequire;
}

declare module 'angular' {
  interface INgModelController {
    $options: any;
  }

  interface ITranscludeFunction {
    (cloneAttachFn: ICloneAttachFunction, futureParentElement: JQuery|null, slotName: string): IAugmentedJQuery;
  }
}
