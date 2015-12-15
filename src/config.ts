
export interface Config {
  production: boolean
  development: boolean
}

const env = process.env.NODE_ENV;

export const config: Config = {
  production: env === 'production',
  development: env === 'development',
};

