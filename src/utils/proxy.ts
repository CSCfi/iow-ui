
export function proxyToInstance<T>(instance: () => T): T {

  const handler = {
    get(_target: any, propertyKey: PropertyKey) {
      return (instance() as any)[propertyKey];
    },
    set(_target: any, propertyKey: PropertyKey, value: any) {
      (instance() as any)[propertyKey] = value;
      return true;
    }
  };

  return new Proxy({}, handler) as T;
}
