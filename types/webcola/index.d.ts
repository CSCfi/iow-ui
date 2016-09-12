/**
 * The layout process fires three events:
 *  - start: layout iterations started
 *  - tick: fired once per iteration, listen to this to animate
 *  - end: layout converged, you might like to zoom-to-fit or something at notification of this event
 */
export enum EventType {
  start = 0,
  tick = 1,
  end = 2,
}

export interface Event {
  type: EventType;
  alpha: number;
  stress?: number;
  listener?: () => void;
}

export interface Node {
  x: number;
  y: number;
}

export interface Link<NodeType> {
  source: NodeType;
  target: NodeType;
  length?: number;
}

/**
 * Main interface to cola layout.
 * @class Layout
 */
export class Layout {
  private _canvasSize;
  private _linkDistance;
  private _defaultNodeSize;
  private _linkLengthCalculator;
  private _linkType;
  private _avoidOverlaps;
  private _handleDisconnected;
  private _alpha;
  private _lastStress;
  private _running;
  private _nodes;
  private _groups;
  private _variables;
  private _rootGroup;
  private _links;
  private _constraints;
  private _distanceMatrix;
  private _descent;
  private _directedLinkConstraints;
  private _threshold;
  private _visibilityGraph;
  private _groupCompactness;
  protected event: any;
  on(e: EventType | string, listener: (event: Event) => void): Layout;
  protected trigger(e: Event): void;
  protected kick(): void;
  /**
   * iterate the layout.  Returns true when layout converged.
   */
  protected tick(): boolean;
  /**
   * the list of nodes.
   * If nodes has not been set, but links has, then we instantiate a nodes list here, of the correct size,
   * before returning it.
   * @property nodes {Array}
   * @default empty list
   */
  nodes(): Array<Node>;
  nodes(v: Array<Node>): Layout;
  /**
   * a list of hierarchical groups defined over nodes
   * @property groups {Array}
   * @default empty list
   */
  groups(): Array<any>;
  groups(x: Array<any>): Layout;
  powerGraphGroups(f: Function): Layout;
  /**
   * if true, the layout will not permit overlaps of the node bounding boxes (defined by the width and height properties on nodes)
   * @property avoidOverlaps
   * @type bool
   * @default false
   */
  avoidOverlaps(): boolean;
  avoidOverlaps(v: boolean): Layout;
  /**
   * if true, the layout will not permit overlaps of the node bounding boxes (defined by the width and height properties on nodes)
   * @property avoidOverlaps
   * @type bool
   * @default false
   */
  handleDisconnected(): boolean;
  handleDisconnected(v: boolean): Layout;
  /**
   * causes constraints to be generated such that directed graphs are laid out either from left-to-right or top-to-bottom.
   * a separation constraint is generated in the selected axis for each edge that is not involved in a cycle (part of a strongly connected component)
   * @param axis {string} 'x' for left-to-right, 'y' for top-to-bottom
   * @param minSeparation {number|link=>number} either a number specifying a minimum spacing required across all links or a function to return the minimum spacing for each link
   */
  flowLayout(axis: string, minSeparation: number | ((t: any) => number)): Layout;
  /**
   * links defined as source, target pairs over nodes
   * @property links {array}
   * @default empty list
   */
  links(): Array<Link<Node | number>>;
  links(x: Array<Link<Node | number>>): Layout;
  /**
   * list of constraints of various types
   * @property constraints
   * @type {array}
   * @default empty list
   */
  constraints(): Array<any>;
  constraints(c: Array<any>): Layout;
  /**
   * Matrix of ideal distances between all pairs of nodes.
   * If unspecified, the ideal distances for pairs of nodes will be based on the shortest path distance between them.
   * @property distanceMatrix
   * @type {Array of Array of Number}
   * @default null
   */
  distanceMatrix(): Array<Array<number>>;
  distanceMatrix(d: Array<Array<number>>): Layout;
  /**
   * Size of the layout canvas dimensions [x,y]. Currently only used to determine the midpoint which is taken as the starting position
   * for nodes with no preassigned x and y.
   * @property size
   * @type {Array of Number}
   */
  size(): Array<number>;
  size(x: Array<number>): Layout;
  /**
   * Default size (assume nodes are square so both width and height) to use in packing if node width/height are not specified.
   * @property defaultNodeSize
   * @type {Number}
   */
  defaultNodeSize(): number;
  defaultNodeSize(x: number): Layout;
  /**
   * The strength of attraction between the group boundaries to each other.
   * @property defaultNodeSize
   * @type {Number}
   */
  groupCompactness(): number;
  groupCompactness(x: number): Layout;
  /**
   * links have an ideal distance, The automatic layout will compute layout that tries to keep links (AKA edges) as close as possible to this length.
   */
  linkDistance(): number;
  linkDistance(): (t: any) => number;
  linkDistance(x: number): Layout;
  linkDistance(x: (t: any) => number): Layout;
  linkType(f: Function | number): Layout;
  convergenceThreshold(): number;
  convergenceThreshold(x: number): Layout;
  alpha(): number;
  alpha(x: number): Layout;
  getLinkLength(link: any): number;
  static setLinkLength(link: any, length: number): void;
  getLinkType(link: any): number;
  linkAccessor: {
    getSourceIndex: (e: any) => any;
    getTargetIndex: (e: any) => any;
    setLength: (link: any, length: number) => void;
    getType: (l: any) => any;
  };
  /**
   * compute an ideal length for each link based on the graph structure around that link.
   * you can use this (for example) to create extra space around hub-nodes in dense graphs.
   * In particular this calculation is based on the "symmetric difference" in the neighbour sets of the source and target:
   * i.e. if neighbours of source is a and neighbours of target are b then calculation is: sqrt(|a union b| - |a intersection b|)
   * Actual computation based on inspection of link structure occurs in start(), so links themselves
   * don't have to have been assigned before invoking this function.
   * @param {number} [idealLength] the base length for an edge when its source and start have no other common neighbours (e.g. 40)
   * @param {number} [w] a multiplier for the effect of the length adjustment (e.g. 0.7)
   */
  symmetricDiffLinkLengths(idealLength: number, w?: number): Layout;
  /**
   * compute an ideal length for each link based on the graph structure around that link.
   * you can use this (for example) to create extra space around hub-nodes in dense graphs.
   * In particular this calculation is based on the "symmetric difference" in the neighbour sets of the source and target:
   * i.e. if neighbours of source is a and neighbours of target are b then calculation is: |a intersection b|/|a union b|
   * Actual computation based on inspection of link structure occurs in start(), so links themselves
   * don't have to have been assigned before invoking this function.
   * @param {number} [idealLength] the base length for an edge when its source and start have no other common neighbours (e.g. 40)
   * @param {number} [w] a multiplier for the effect of the length adjustment (e.g. 0.7)
   */
  jaccardLinkLengths(idealLength: number, w?: number): Layout;
  /**
   * start the layout process
   * @method start
   * @param {number} [initialUnconstrainedIterations=0] unconstrained initial layout iterations
   * @param {number} [initialUserConstraintIterations=0] initial layout iterations with user-specified constraints
   * @param {number} [initialAllConstraintsIterations=0] initial layout iterations with all constraints including non-overlap
   * @param {number} [gridSnapIterations=0] iterations of "grid snap", which pulls nodes towards grid cell centers - grid of size node[0].width - only really makes sense if all nodes have the same width and height
   */
  start(initialUnconstrainedIterations?: number, initialUserConstraintIterations?: number, initialAllConstraintsIterations?: number, gridSnapIterations?: number): Layout;
  resume(): Layout;
  stop(): Layout;
  prepareEdgeRouting(nodeMargin?: number): void;
  routeEdge(d: any, draw: any): any[];
  static getSourceIndex(e: any): any;
  static getTargetIndex(e: any): any;
  static linkId(e: any): string;
  static dragStart(d: any): void;
  static dragEnd(d: any): void;
  static mouseOver(d: any): void;
  static mouseOut(d: any): void;
}
