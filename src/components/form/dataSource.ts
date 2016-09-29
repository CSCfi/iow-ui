import { IPromise } from 'angular';

export interface DataSource<T> {
  (search: string): IPromise<T[]>;
}
