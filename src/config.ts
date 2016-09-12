import * as moment from 'moment';
import { Moment } from 'moment';

export interface Config {
  apiEndpointWithName(name: string): string;
  apiEndpoint: string;
  production: boolean;
  development: boolean;
  gitDate: Moment;
  gitHash: string;
  fintoUrl: string;
}

class EnvironmentConfig implements Config {

  apiEndpointWithName(name: string) {
    return `${this.apiEndpoint}/rest/${name}`;
  }

  get apiEndpoint() {
    return process.env.API_ENDPOINT || '/api';
  }

  get production() {
    return process.env.NODE_ENV === 'production';
  }

  get development() {
    return process.env.NODE_ENV === 'development';
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
}

export const config: Config = new EnvironmentConfig();
