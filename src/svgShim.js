
if (SVGElement.prototype.contains === undefined) {
  SVGElement.prototype.contains = function(el) {
    return jQuery.contains(this, el);
  };
}

if (SVGElement.prototype.getElementsByClassName === undefined) {
  SVGElement.prototype.getElementsByClassName = function(className) {
    return this.querySelectorAll('.' + className);
  };
}
