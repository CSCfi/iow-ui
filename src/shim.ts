import 'core-js';
import './svgShim';
import 'proxy-polyfill';
import 'css.escape';

window.requestAnimFrame =
  window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || ((callback: FrameRequestCallback) => window.setTimeout(callback, 1000 / 60));
