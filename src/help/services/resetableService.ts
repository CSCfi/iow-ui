import { IPromise } from 'angular';

export interface ResetableService {
  reset(): IPromise<any>;
}
