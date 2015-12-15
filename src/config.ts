
export interface Config {
  production: boolean
  development: boolean
  gitDate: Date;
  gitHash: string;
}

const env = process.env.NODE_ENV;
const gitDate = new Date(process.env.GIT_DATE);
const gitHash = process.env.GIT_HASH;

export const config: Config = {
  production: env === 'production',
  development: env === 'development',
  gitDate,
  gitHash
};

