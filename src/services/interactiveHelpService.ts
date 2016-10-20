import { InteractiveHelpModelService } from './modelService';
import { InteractiveHelpVisualizationService } from './visualizationService';
import { ResetableService } from './';
import { IPromise, IQService } from 'angular';

export class InteractiveHelpService implements ResetableService {

  open = false;

  private helpServices: ResetableService[];

  /* @ngInject */
  constructor(private $q: IQService,
              helpModelService: InteractiveHelpModelService,
              helpVisualizationService: InteractiveHelpVisualizationService) {

    this.helpServices = [
      helpModelService,
      helpVisualizationService
    ];
  }

  reset(): IPromise<any> {
    return this.$q.all(this.helpServices.map(service => service.reset()));
  }
}
