import { Model } from '../../services/entities';
import { IPromise } from 'angular';

export function modelScopeCache<T>(modelProvider: () => Model, dataProvider: (model: Model) => IPromise<T>): () => IPromise<T> {

  let cachedResult: IPromise<T>;
  let previousModel: Model;

  return () => {

    const model = modelProvider();

    if (!cachedResult || model !== previousModel) {
      cachedResult = dataProvider(model);
      previousModel = model;
    }

    return cachedResult;
  };
}
