import { config } from '../../config';
import { expandContextWithKnownModels, collectIds } from '../utils/entity';
import { index } from '../utils/array';
import { requireDefined } from '../utils/object';
import * as frames from '../entities/frames';
import { FrameService } from './frameService';
import { GraphData } from '../entities/contract';
import { ModelPositions, VisualizationClass, DefaultVisualizationClass } from '../entities/visualization';
import { Model } from '../entities/model';
import { IPromise, IQService, IHttpService } from 'angular';

export interface VisualizationService {
  getVisualization(model: Model): IPromise<ClassVisualization>;
  updateModelPositions(model: Model, modelPositions: ModelPositions): IPromise<any>;
}

export class DefaultVisualizationService implements VisualizationService {

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private frameService: FrameService) {
  }

  getVisualization(model: Model) {
    return this.$q.all([this.getVisualizationClasses(model), this.getModelPositions(model)])
      .then(([classes, positions]) => new ClassVisualization(classes, positions));
  }

  private getVisualizationClasses(model: Model) {

    const params = {
      graph: model.id.uri,
      'content-type': 'application/ld+json'
    };

    return this.$http.get<GraphData>(config.apiEndpointWithName('exportModel'), { params })
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializeModelVisualization(response.data!));
  }

  private getModelPositions(model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('modelPositions'), { params: { model: model.id.uri } })
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializeModelPositions(response.data!), _err => this.newModelPositions(model));
  }

  updateModelPositions(model: Model, modelPositions: ModelPositions) {
    return this.$http.put(config.apiEndpointWithName('modelPositions'), modelPositions.serialize(), { params: { model: model.id.uri } });
  }

  newModelPositions(model: Model) {
    const frame: any = frames.modelPositionsFrame({ '@context': model.context });
    return new ModelPositions([], frame['@context'], frame);
  }

  private deserializeModelVisualization(data: GraphData): IPromise<VisualizationClass[]> {
    return this.frameService.frameAndMapArray(data, frames.classVisualizationFrame(data), () => DefaultVisualizationClass);
  }

  private deserializeModelPositions(data: GraphData): IPromise<ModelPositions> {
    return this.frameService.frameAndMapArrayEntity(data, frames.modelPositionsFrame(data), () => ModelPositions);
  }
}

export class ClassVisualization {

  private classIndex: Map<string, VisualizationClass>;

  constructor(public classes: VisualizationClass[], public positions: ModelPositions) {
    this.classIndex = index(classes, klass => klass.id.toString());
  }

  getClassById(classId: string) {
    return requireDefined(this.classIndex.get(classId));
  }

  getClassIds() {
    return collectIds(this.classes);
  }

  getClassIdsWithoutPosition() {
    return this.classes.filter(c => !this.positions.isClassDefined(c.id)).map(c => c.id);
  }

  addPositionChangeListener(listener: () => void) {
    this.positions.addChangeListener(listener);
  }
}
