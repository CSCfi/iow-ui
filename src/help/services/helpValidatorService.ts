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
              private helpPredicateService: InteractiveHelpPredicateService,
              private defaultValidatorService: ValidatorService) {
  }

  classDoesNotExist(id: Uri): IPromise<boolean> {
    const helpServiceHasResource = this.helpClassService.store.getResourcesForAllModels().has(id.toString());
    return helpServiceHasResource ? this.$q.when(true) : this.defaultValidatorService.classDoesNotExist(id);
  }

  predicateDoesNotExist(id: Uri): IPromise<boolean> {
    const helpServiceHasResource = this.helpPredicateService.store.getResourcesForAllModels().has(id.toString());
    return helpServiceHasResource ? this.$q.when(true) : this.defaultValidatorService.predicateDoesNotExist(id);
  }

  reset(): IPromise<any> {
    return this.$q.when();
  }
}
