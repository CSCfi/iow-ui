import IAttributes = angular.IAttributes;
import ILocaleService = angular.ILocaleService;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Predicate, Model } from '../../services/entities';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import { PredicateService } from '../../services/predicateService';

mod.directive('propertyPredicateView', () => {
  return {
    scope: {
      predicateOrId: '=predicate',
      model: '='
    },
    restrict: 'E',
    template: require('./propertyPredicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: PropertyPredicateViewController
  };
});


class PropertyPredicateViewController {

  predicateOrId: Predicate|Uri;
  model: Model;
  predicate: Predicate;

  /* @ngInject */
  constructor(private predicateService: PredicateService) {
    const predicate = this.predicateOrId;

    if (predicate instanceof Predicate) {
      this.predicate = predicate;
    } else if (predicate instanceof Uri) {
      if (this.model.isNamespaceKnownToBeNotModel(predicate.namespace)) {
        predicateService.getExternalPredicate(predicate, this.model).then(p => this.predicate = p);
      } else {
        predicateService.getPredicate(predicate).then(p => this.predicate = p);
      }
    } else {
      throw new Error('Unsupported predicate: ' + predicate);
    }
  }
}
