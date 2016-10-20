import { ResetableService } from './resetableService';
import { IPromise, IQService } from 'angular';
import { InteractiveHelpModelService } from './helpModelService';
import { InteractiveHelpVisualizationService } from './helpVisualizationService';
import { InteractiveHelpUserService } from './helpUserService';

export class InteractiveHelpService implements ResetableService {

  open = false;

  private helpServices: ResetableService[];

  /* @ngInject */
  constructor(private $q: IQService,
              helpModelService: InteractiveHelpModelService,
              helpVisualizationService: InteractiveHelpVisualizationService,
              helpUserService: InteractiveHelpUserService) {

    this.helpServices = [
      helpModelService,
      helpVisualizationService,
      helpUserService
    ];
  }

  reset(): IPromise<any> {
    return this.$q.all(this.helpServices.map(service => service.reset()));
  }
}
