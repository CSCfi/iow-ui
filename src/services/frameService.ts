import { ILogService, IPromise } from 'angular';
import {
  GraphData, EntityFactory, EntityConstructor,
  EntityArrayFactory, EntityArrayConstructor
} from '../entities/contract';
import { Frame } from '../entities/frames';
import { normalizeAsArray } from '../utils/array';
import { GraphNode, GraphNodes } from '../entities/graphNode';

const jsonld: any = require('jsonld');

export class FrameService {

  /* @ngInject */
  constructor(private $log: ILogService) {
  }

  private frameData(data: GraphData, frame: any): IPromise<GraphData> {
    return jsonld.promises.frame(data, frame)
      .then((framed: any) => framed, (err: any) => {
        this.$log.error(frame);
        this.$log.error(data);
        this.$log.error(err.message);
        this.$log.error(err.details.cause);
      });
  }


  frameAndMap<T extends GraphNode>(data: GraphData, optional: boolean, frame: Frame, entityFactory: EntityFactory<T>): IPromise<T> {

    return this.frameData(data, frame)
      .then(framed => {
        try {
          if (optional && framed['@graph'].length === 0) {
            return null;
          } else if (framed['@graph'].length > 1) {
            throw new Error('Multiple graphs found: \n' + JSON.stringify(framed, null, 2));
          } else {
            const entity: EntityConstructor<T> = entityFactory(framed);
            return new entity(framed['@graph'][0], framed['@context'], frame);
          }
        } catch (error) {
          this.$log.error(error);
          throw error;
        }
      });
  }

  frameAndMapArray<T extends GraphNode>(data: GraphData, frame: Frame, entityFactory: EntityFactory<T>): IPromise<T[]> {

    return this.frameData(data, frame)
      .then(framed => {
        try {
          return normalizeAsArray(framed['@graph']).map(element => {
            const entity: EntityConstructor<T> = entityFactory(element);
            return new entity(element, framed['@context'], frame);
          });
        } catch (error) {
          this.$log.error(error);
          throw error;
        }
      });
  }

  frameAndMapArrayEntity<T extends GraphNode, A extends GraphNodes<T>>(data: GraphData, frame: Frame, entityArrayFactory: EntityArrayFactory<T, A>): IPromise<A> {

    return this.frameData(data, frame)
      .then(framed => {
        try {
          const entity: EntityArrayConstructor<T, A> = entityArrayFactory(framed);
          return new entity(framed['@graph'], framed['@context'], frame);
        } catch (error) {
          this.$log.error(error);
          throw error;
        }
      });
  }
}
