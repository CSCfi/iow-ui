import * as _ from 'lodash';
import { IPromise, IHttpPromise, IRequestShortcutConfig, IHttpPromiseCallback, IHttpPromiseCallbackArg, IRequestConfig, IHttpService } from 'angular';
const request = require('request');
const hstd = require('http-status-to-description');

class AngularPromiseWrapper<T> implements IHttpPromise<T> {

  constructor(private promise: Promise<T>) {}

  then<TResult>(successCallback: (promiseValue: IHttpPromiseCallbackArg<T>) => (IPromise<TResult>|TResult),
                errorCallback?: (reason: any) => any, notifyCallback?: (state: any) => any) {
    return <IPromise<TResult>> <any> this.promise.then(successCallback, errorCallback);
  }

  success(callback: IHttpPromiseCallback<T>): IHttpPromise<T> {
    throw new Error('Unimplemented');
  }

  error(callback: IHttpPromiseCallback<any>): IHttpPromise<T> {
    throw new Error('Unimplemented');
  }

  catch<TResult>(onRejected: (reason:any) => (IPromise<TResult>|TResult)): IPromise<TResult> {
    throw new Error('Unimplemented');
  }

  finally(finallyCallback: () => any): IPromise<IHttpPromiseCallbackArg<T>> {
    throw new Error('Unimplemented');
  }
}

const pendingRequests: IRequestConfig[] = [];


function makeUrl(url: string, params?: any) {
  if (!params) {
    return url;
  } else {
    const parts: string[] = [];
    for (const key of Object.keys(params)) {
      const value = params[key];
      parts.push(`${encodeURIComponent(key)}=${!value ? 'undefined' : encodeURIComponent(params[key])}`);
    }
    return `${url}?${parts.join('&')}`;
  }
}

function isNotHtml(headers: any) {
  const contentType = headers['content-type'] || '';
  return contentType.indexOf('text/html') === -1;
}

function makeRequest<T>(method: string, url: string, config: IRequestShortcutConfig = {}): IHttpPromise<T> {

  const requestConfig = Object.assign({}, config, { method, url });
  pendingRequests.push(requestConfig);

  return new AngularPromiseWrapper(new Promise((resolve, reject) => {

    const options = {
      method,
      url: makeUrl(url, config.params),
      headers: config.headers || {},
      json: config.data,
      body: config.data,
      timeout: config.timeout,
      jar: true,
      followRedirect: false
    };

    function rejectAndReport(err: any) {
      console.log('Error');
      console.log(err);
      reject(err);
    }

    const callback = (err: any, resp: any, body: any) => {
      _.remove(pendingRequests, requestConfig);
      if (err) {
        rejectAndReport(err);
      } else {
        console.log(options.method + ': ' + options.url + ' -> ' + resp.statusCode + ": " + hstd(resp.statusCode));
        if (resp.statusCode < 200 || resp.statusCode >= 400) {
          rejectAndReport(body);
        } else {
          resolve({
            data: isNotHtml(resp.headers) && typeof body === 'string' && !!body ? JSON.parse(body) : body,
            status: resp.statusCode,
            headers(headerName?: string) {
              if (!headerName) {
                return resp.headers;
              } else {
                return resp.headers[headerName];
              }
            },
            config: requestConfig,
            statusText: hstd(resp.statusCode)
          });
        }
      }
    };

    request(options, callback);
  }));
}

const requests: any = function<T>(config: IRequestConfig) {
  return makeRequest<T>(config.method, config.url, config);
};

requests.pendingRequest = pendingRequests;

requests.get = function<T>(url: string, config?: IRequestShortcutConfig): IHttpPromise<T> {
  return makeRequest<T>('GET', url, config);
};
requests.post = function<T>(url: string, data: any, config?: IRequestShortcutConfig): IHttpPromise<T> {
  return makeRequest<T>('POST', url, Object.assign(config, {data}));
};
requests.put = function<T>(url: string, data: any, config?: IRequestShortcutConfig): IHttpPromise<T> {
  return makeRequest<T>('PUT', url, Object.assign(config, {data}));
};
requests.patch = function<T>(url: string, data: any, config?: IRequestShortcutConfig): IHttpPromise<T> {
  return makeRequest<T>('PATCH', url, Object.assign(config, {data}));
};
requests.delete = function<T>(url: string, config?: IRequestShortcutConfig): IHttpPromise<T> {
  return makeRequest<T>('DELETE', url, config);
};
requests.head = function<T>(url: string, config?: IRequestShortcutConfig): IHttpPromise<T> {
  return makeRequest<T>('HEAD', url, config);
};
requests.jsonp = function<T>(url: string, config?: IRequestShortcutConfig): IHttpPromise<T> {
  throw new Error('Unsupported');
};

Object.defineProperty(request, 'defaults', {
  get: function() { throw new Error('Unsupported') },
  set: function(newValue) { throw new Error('Unsupported') },
});

export const httpService: IHttpService = requests;

