import { IPromise } from 'angular';
import { Model } from '../../services/entities';

export interface DataSource<T> {
  (search: string): IPromise<T[]>;
}

export function modelScopeCachedNonFilteringDataSource<T>(modelProvider: () => Model, dataSourceProvider: (model: Model) => DataSource<T>): DataSource<T> {

  let cachedResult: IPromise<T[]>;
  let previousModel: Model;

  return search => {

    const model = modelProvider();

    if (!cachedResult || model !== previousModel) {
      cachedResult = dataSourceProvider(model)(search);
      previousModel = model;
    }

    return cachedResult;
  };
}
