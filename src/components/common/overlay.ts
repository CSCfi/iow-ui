import { IScope, IRootScopeService, IPromise, IQService, IDocumentService, IControllerService, ICompileService, IDeferred, IAugmentedJQuery, animate } from 'angular';
import IAnimateService = animate.IAnimateService;

/**
 * Interface providing access to overlays by clients. Available as '$overlayInstance' in scope.
 */
export interface OverlayInstance {
  result: IPromise<any>;
  opened: IPromise<any>;
  closed: IPromise<any>;
  close(result?: any): void;
  dismiss(reason?: any): void;
}

export interface OverlayOptions {
  template: string;
  controller?: any;
  controllerAs?: string;
  resolve?: any;
  appendTo?: any;
  scope?: IScope;
}

export interface IOverlayScope extends IScope {
  $close(result?: any): void;
  $dismiss(reason?: any): void;
  $$overlayDestructionScheduled?: boolean;
}

export class OverlayService {

  /* @ngInject */
  constructor(private $rootScope: IRootScopeService,
              private $q: IQService,
              private $document: IDocumentService,
              private $controller: IControllerService,
              private $compile: ICompileService,
              private $animate: IAnimateService,
              private $uibResolve: { resolve(options: any): IPromise<any> }) {
  }

  open(options: OverlayOptions): OverlayInstance {

    if (!options.template) throw new Error('template is required');

    const appendTo = options.appendTo || this.$document.find('body').eq(0);
    const instance = new DefaultOverlayInstance(this.$q, this.$animate);

    this.$uibResolve.resolve(options.resolve || {}).then(vars => {
      const parentScope = options.scope || this.$rootScope;
      const scope = instance.createScope(parentScope);

      if (options.controller) {
        const locals = angular.extend({
          $scope: scope,
          $overlayInstance: instance
        }, vars);

        const instantiator: any = this.$controller(options.controller, locals, true);
        const ctrl = instantiator();

        if (options.controllerAs)
          scope[options.controllerAs] = ctrl;

        if (angular.isFunction(ctrl.$onInit))
          ctrl.$onInit();
      }

      const elem = angular.element(options.template);
      this.$animate.enter(this.$compile(elem)(scope), appendTo);

      instance.element = () => elem;
      instance.openedDeferred.resolve(true);

    }, reason => {
      instance.openedDeferred.reject(reason);
      instance.resultDeferred.reject(reason);
    });

    return instance;
  }
}

class DefaultOverlayInstance implements OverlayInstance {

  result: IPromise<any>;
  opened: IPromise<any>;
  closed: IPromise<any>;
  resultDeferred: IDeferred<any>;
  openedDeferred: IDeferred<any>;
  closedDeferred: IDeferred<any>;

  // We'd like to store scope and element normally, but angular would try to copy those
  // values and fail. By wrapping the values inside functions, Angular works correctly.
  scope: () => IOverlayScope;
  element: () => IAugmentedJQuery;

  constructor($q: IQService, private $animate: IAnimateService) {

    this.resultDeferred = $q.defer();
    this.openedDeferred = $q.defer();
    this.closedDeferred = $q.defer();

    this.result = this.resultDeferred.promise;
    this.opened = this.openedDeferred.promise;
    this.closed = this.closedDeferred.promise;
  }

  /**
   * Create a scope for this instance. Note that we can't create the scope from constructor,
   * because this instance needs to be returned even if initialization fails. We only want
   * the scope to be created if constructor is successful.
   */
  createScope(parentScope: IScope): IOverlayScope {
    const scope = parentScope.$new() as IOverlayScope;
    scope.$close = this.close.bind(this);
    scope.$dismiss = this.dismiss.bind(this);

    scope.$on('$destroy', () => {
      if (!scope.$$overlayDestructionScheduled)
        this.dismiss('unscheduledDestruction');
    });

    this.scope = () => scope;
    return scope;
  }

  close(result?: any) {
    this.closeOrDismiss(result, true);
  }

  dismiss(reason?: any) {
    this.closeOrDismiss(reason, false);
  }

  private closeOrDismiss(result: any, closing: boolean) {
    const scope = this.scope();

    if (scope.$broadcast('overlay.closing', result, closing).defaultPrevented)
      return;

    scope.$$overlayDestructionScheduled = true;

    if (closing) {
      this.resultDeferred.resolve(result);
    } else {
      this.resultDeferred.reject(result);
    }

    const elem = this.element();

    this.$animate.leave(elem).then(() => {
      elem.remove();
      this.closedDeferred.resolve();
    });

    scope.$destroy();
  }
}
