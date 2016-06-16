import 'core-js';
import * as jQuery from 'jquery';

if (SVGElement.prototype.contains === undefined) {
  SVGElement.prototype.contains = function(el: any) {
    return jQuery.contains(this, el);
  };
}

if (SVGElement.prototype.getElementsByClassName === undefined) {
  SVGElement.prototype.getElementsByClassName = function(className: string) {
    return this.querySelectorAll('.' + className);
  };
}

window.requestAnimFrame =
  window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || ((callback: FrameRequestCallback) => window.setTimeout(callback, 1000 / 60));
