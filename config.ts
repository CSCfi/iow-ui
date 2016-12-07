export type Environment = 'local'
                        | 'development'
                        | 'production';

export const dateFormat = 'YYYY-MM-DD HH:mm:ss ZZ';

export interface Config {
  apiEndpointWithName(name: string): string;
  apiEndpoint: string;
  environment: Environment;
  gitDate: string;
  gitHash: string;
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
    return process.env.GIT_DATE;
  }

  get gitHash() {
    return process.env.GIT_HASH;
  }

  defaultModelNamespace(prefix: string) {
    return defaultModelNamespaceForEnvironmentAndPrefix(this.environment, prefix);
  }
}

export function defaultModelNamespaceForEnvironmentAndPrefix(environment: Environment, prefix: string) {
  switch (environment) {
    case 'local':
    case 'production':
      return `http://iow.csc.fi/ns/${prefix}`;
    case 'development':
      return `http://iowdev.csc.fi/ns/${prefix}`;
    default:
      return assertNever(environment);
  }
}

function assertNever(environment: never): never {
  throw new Error('Unsupported environment: ' + environment);
}

export const config: Config = new EnvironmentConfig();
