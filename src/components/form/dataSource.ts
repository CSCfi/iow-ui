import { IPromise } from 'angular';

export interface DataSource<T> {
  (search: string): IPromise<T[]>;
}

export interface CachedDataSource<T> extends DataSource<T> {
  invalidateCache(): void;
}

export function cacheNonFilteringDataSource<T>(dataSource: DataSource<T>): CachedDataSource<T> {

  let cachedResult: IPromise<T[]>;

  const result: any = (search: string) => {

    if (!cachedResult) {
      cachedResult = dataSource(search);
    }

    return cachedResult;
  };

  const invalidateCache: () => void = () => cachedResult = null;
  result.invalidateCache = invalidateCache;

  return result;
}
