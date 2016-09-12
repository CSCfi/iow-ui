declare module 'node-uuid' {
  export interface V1Options {
    /** Node id as Array of 6 bytes (per 4.1.6). Default: Randomly generated ID. */
    node?: number[];
    /** (Number between 0 - 0x3fff) RFC clock sequence. Default: An internally maintained clockseq is used. */
    clockseq?: number;
    /** Time in milliseconds since unix Epoch. Default: The current time is used. */
    msecs?: number | Date;
    /**
     * (Number between 0-9999) additional time, in 100-nanosecond units.
     * Ignored if msecs is unspecified. Default: internal uuid counter is used, as per 4.2.1.2.
     */
    nsecs?: number;
  }

  /**
   * Generate and return a RFC4122 v1 (timestamp-based) UUID.
   * Returns buffer, if specified, otherwise the string form of the UUID.
   * @param options Optional uuid state to apply.
   * @param buffer Array or buffer where UUID bytes are to be written.
   * @param offset Starting index in buffer at which to begin writing.
   */
  export function v1(options?: V1Options, buffer?: void, offset?: number): string;
  export function v1(options?: V1Options, buffer?: number[], offset?: number): number[];

  export interface V4Options {
    /** Array of 16 numbers (0 - 255) to use in place of randomly generated values */
    random?: number[];
    /**
     * Random # generator to use.
     * Set to one of the built-in generators - uuid.mathRNG(all platforms), uuid.nodeRNG(node.js only),
     *   uuid.whatwgRNG(WebKit only) - or a custom function that returns an array[16] of byte values.
     */
    rng?: Function;
  }
  /**
   * Generate and return a RFC4122 v4 UUID.
   * Returns buffer, if specified, otherwise the string form of the UUID.
   * @param options Optional uuid state to apply.
   * @param buffer Array or buffer where UUID bytes are to be written.
   * @param offset Starting index in buffer at which to begin writing.
   */
  export function v4(options?: V4Options, buffer?: void, offset?: number): string;
  export function v4(options?: V4Options, buffer?: number[], offset?: number): number[];

  /**
   * Parse UUIDs
   * @param id UUID(-like) string
   * @param buffer Array or buffer where UUID bytes are to be written. Default: A new Array or Buffer is used
   * @param offset Starting index in buffer at which to begin writing. Default: 0
   */
  export function parse(id: string, buffer?: number[], offset?: number): number[];

  /**
   * Unparse UUIDs
   * @param buffer Array or buffer where UUID bytes are to be written. Default: A new Array or Buffer is used
   * @param offset Starting index in buffer at which to begin writing. Default: 0
   */
  export function unparse(buffer?: number[], offset?: number): string;
}
