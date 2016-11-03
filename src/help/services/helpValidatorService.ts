import { IPromise, IQService } from 'angular';
import { ValidatorService } from '../../services/validatorService';
import { ResetableService } from './resetableService';
import { Uri } from '../../entities/uri';
import { InteractiveHelpClassService } from './helpClassService';
import { InteractiveHelpPredicateService } from './helpPredicateService';

export class InteractiveHelpValidatorService implements ValidatorService, ResetableService {

  /* @ngInject */
  constructor(private $q: IQService,
              private helpClassService: InteractiveHelpClassService,
              private helpPredicateService: InteractiveHelpPredicateService) {
  }

  classDoesNotExist(id: Uri): IPromise<boolean> {
    return this.$q.when(this.helpClassService.store.getResourcesForAllModels().has(id.toString()));
  }

  predicateDoesNotExist(id: Uri): IPromise<boolean> {
    return this.$q.when(this.helpPredicateService.store.getResourcesForAllModels().has(id.toString()));
  }

  reset(): IPromise<any> {
    return this.$q.when();
  }
}
