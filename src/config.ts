import * as moment from 'moment';
import { Moment } from 'moment';
import { assertNever } from './utils/object';

export type Environment = 'local'
                        | 'development'
                        | 'production';

export interface Config {
  apiEndpointWithName(name: string): string;
  apiEndpoint: string;
  environment: Environment;
  gitDate: Moment;
  gitHash: string;
  fintoUrl: string;
  defaultModelNamespace(prefix: string): string;
}

class EnvironmentConfig implements Config {

  apiEndpointWithName(name: string) {
    return `${this.apiEndpoint}/rest/${name}`;
  }

  get apiEndpoint() {
    return process.env.API_ENDPOINT || '/api';
  }

  get environment(): Environment {
    return process.env.NODE_ENV;
  }

  get gitDate() {
    return moment(process.env.GIT_DATE, 'YYYY-MM-DD HH:mm:ss ZZ');
  }

  get gitHash() {
    return process.env.GIT_HASH;
  }

  get fintoUrl() {
    return process.env.FINTO_URL || 'http://dev.finto.fi/';
  }

  defaultModelNamespace(prefix: string) {
    switch (this.environment) {
      case 'local':
      case 'production':
        return `http://iow.csc.fi/ns/${prefix}`;
      case 'development':
        return `http://iowdev.csc.fi/ns/${prefix}`;
      default:
        return assertNever(this.environment, 'Unsupported environment: ' + this.environment);
    }
  }
}

export const config: Config = new EnvironmentConfig();
