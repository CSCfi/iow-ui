import { IPromise, IQService } from 'angular';
import { ValidatorService } from '../../services/validatorService';
import { ResetableService } from './resetableService';
import { Uri } from '../../entities/uri';
import { InteractiveHelpClassService } from './helpClassService';

export class InteractiveHelpValidatorService implements ValidatorService, ResetableService {

  /* @ngInject */
  constructor(private $q: IQService,
              private defaultValidatorService: ValidatorService,
              private helpClassService: InteractiveHelpClassService) {
  }

  classDoesNotExist(id: Uri): IPromise<boolean> {
    return this.$q.when(!this.helpClassService.classes.has(id.toString()));
  }

  predicateDoesNotExist(id: Uri): IPromise<boolean> {
    return this.defaultValidatorService.predicateDoesNotExist(id);
  }

  reset(): IPromise<any> {
    return this.$q.when();
  }
}
