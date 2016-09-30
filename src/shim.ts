import 'core-js';
import './svgShim';

window.requestAnimFrame =
  window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || ((callback: FrameRequestCallback) => window.setTimeout(callback, 1000 / 60));
