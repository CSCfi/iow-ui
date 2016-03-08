// Compiled using typings@0.6.8
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/f869c1eaefa23e1ea2a69d0dbf47ab2a05192d9b/jointjs/jointjs.d.ts
// Type definitions for Joint JS 0.9.3
// Project: http://www.jointjs.com/
// Definitions by: Aidan Reel <http://github.com/areel>, David Durman <http://github.com/DavidDurman>, Ewout Van Gossum <https://github.com/DenEwout>
// Definitions: https://github.com/borisyankov/DefinitelyTyped



declare module joint {

  module dia {

    interface IElementSize {
      width: number;
      height: number;
    }

    class Graph extends Backbone.Model {
      getElements() : Element[];
      getLinks() : Link[];
      getCell(id: string): Cell;
      getCells() : Cell[];
      getFirstCell() : Cell;
      getLastCell() : Cell;
      addCell(cell:Cell) : void;
      addCells(cells:Cell[]) : void;
      initialize() : void;
      fromJSON(json:any) : void;
      toJSON() : Object;
      clear() : void;
      getConnectedLinks(cell:Cell, opt?:any):Link[];
      disconnectLinks(cell:Cell) : void;
      removeLinks(cell:Cell) : void;
      findModelsFromPoint(point:{x : number; y: number}):Element[];
    }

    class Cell extends Backbone.Model {
      toJSON() : Object;
      remove(options?:any) : void;
      toFront() : void;
      toBack() : void;
      embed(cell:Cell) : void;
      unembed(cell:Cell) : void;
      getEmbeddedCells():Cell[];
      clone(opt?:any):Backbone.Model;      // @todo: return can either be Cell or Cell[].
      attr(attrs:any):Cell;
      isLink(): boolean;
      prop(path: string, value: any): void;
    }

    class Element extends Cell {
      id: string;
      attributes: {
        position: { x: number, y: number };
        size: { height: number, width: number };
      };
      position(x:number, y:number):Element;
      translate(tx:number, ty?:number):Element;
      resize(width:number, height:number):Element;
      rotate(angle:number, options : {absolute : boolean; origin: {x:number;y:number}}):Element;
      remove(): void;
      getBBox():{ x: number; y: number; width: number; height: number; center(): {x: number, y: number, theta(point: {x: number, y:number}): number}};
    }

    interface IDefaults {
      type: string;
    }

    class Link extends Cell {
      constructor(options: any);
      attributes: {
        source: { id: string };
        target: { id: string };
      };
      defaults():IDefaults;
      disconnect():Link;
      label(idx?:number, value?:any):any;   // @todo: returns either a label under idx or Link if both idx and value were passed
      remove(): void;
    }

    interface IOptions {
      width?: number;
      height?: number;
      gridSize?: number;
      perpendicularLinks?: boolean;
      elementView?: ElementView;
      linkView?: LinkView;
      origin: {
        x: number,
        y: number
      }
    }

    class Paper extends Backbone.View<Graph> {

      constructor(options: any);

      svg: SVGSVGElement;
      clientToLocalPoint(point: {x: number, y: number}): {x: number, y: number};
      viewport: any;
      scaleContentToFit(options: any): void;
      setOrigin(x: number, y: number): void;

      options:IOptions;
      setDimensions(width:number, height:number) : void;
      scale(sx:number, sy?:number, ox?:number, oy?:number):Paper;
      rotate(deg:number, ox?:number, oy?:number):Paper;      // @todo not released yet though it's in the source code already
      findView(el:any):CellView;
      findViewByModel(modelOrId:any):CellView;
      findViewsFromPoint(p:{ x: number; y: number; }):CellView[];
      findViewsInArea(r:{ x: number; y: number; width: number; height: number; }):CellView[];
      fitToContent(opt?:any): void;
    }

    class ElementView extends CellView {
      scale(sx:number, sy:number) : void;
    }

    class CellView extends Backbone.View<Cell> {
      getBBox():{ x: number; y: number; width: number; height: number; };
      highlight(el?:any): void;
      unhighlight(el?:any): void;
      findMagnet(el:any): void;
      getSelector(el:any): void;

      pointerdblclick(evt:any, x:number, y:number):void;
      pointerclick(evt:any, x:number, y:number):void;
      pointerdown(evt:any, x:number, y:number):void;
      pointermove(evt:any, x:number, y:number):void;
      pointerup(evt:any, x:number, y:number):void;
    }

    class LinkView extends CellView {
      getConnectionLength():number;
      getPointAtLength(length:number):{ x: number; y: number; };
    }

    module shapes.uml {
      class Class extends joint.dia.Element {
        constructor(options: any);
      }
    }
  }

  module ui {}

  module shapes {
    module basic {
      class Generic extends dia.Element {
      }
      class Rect extends Generic {
      }
      class Text extends Generic {
      }
      class Circle extends Generic {
      }
      class Image extends Generic {
      }
    }
  }

  module util {
    function uuid():string;
    function guid(obj:any):string;
    function mixin(objects:any[]):any;
    function supplement(objects:any[]):any;
    function deepMixin(objects:any[]):any;
    function deepSupplement(objects:any[], defaultIndicator?:any):any;
  }

  module layout {
    class DirectedGraph {
      static layout(graph: joint.dia.Graph, options: any): void;
    }
  }
}
