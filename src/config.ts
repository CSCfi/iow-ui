import * as moment from 'moment';
import Moment = moment.Moment;

export interface Config {
  production: boolean
  development: boolean
  gitDate: Moment;
  gitHash: string;
  fintoUrl: string;
}

const env = process.env.NODE_ENV;
const gitDate = moment(process.env.GIT_DATE, 'YYYY-MM-DD HH:mm:ss ZZ');
const gitHash = process.env.GIT_HASH;
const fintoUrl = process.env.FINTO_URL;

export const config: Config = {
  production: env === 'production',
  development: env === 'development',
  gitDate,
  gitHash,
  fintoUrl: fintoUrl || env === 'development' ? 'http://dev.finto.fi/' : 'http://www.finto.fi/'
};

