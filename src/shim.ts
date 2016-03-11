
import 'core-js';

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
