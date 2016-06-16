/// <reference path="../typings/globals/angular-animate/index.d.ts" />
/// <reference path="../typings/globals/angular-gettext/index.d.ts" />
/// <reference path="../typings/globals/angular-route/index.d.ts" />
/// <reference path="../typings/globals/angular-ui-bootstrap/index.d.ts" />
/// <reference path="../typings/globals/angular/index.d.ts" />
/// <reference path="../typings/globals/change-case/index.d.ts" />
/// <reference path="../typings/globals/core-js/index.d.ts" />
/// <reference path="../typings/globals/jquery/index.d.ts" />
/// <reference path="../typings/globals/lodash/index.d.ts" />
/// <reference path="../typings/globals/modernizr/index.d.ts" />
/// <reference path="../typings/globals/moment-node/index.d.ts" />

/// <reference path="../node_modules/awesome-typescript-loader/lib/runtime.d.ts" />

/// <reference path="./vendor/webcola.d.ts" />
/// <reference path="./vendor/jointjs.d.ts" />

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

// Describes webpack.DefinePlugin provides
interface Process {
  env: {
    'API_ENDPOINT': string,
    'NODE_ENV': string,
    'GIT_DATE': string,
    'GIT_HASH': string,
    'FINTO_URL': string
  };
}

declare const process: Process;

declare module _ {
  interface LoDashExplicitArrayWrapper<T> {
    sort(comparator: (lhs: T, rhs: T) => number): LoDashExplicitArrayWrapper<T>;
  }
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
