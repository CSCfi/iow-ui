import { ResetableService } from './resetableService';
import { IPromise, IQService } from 'angular';
import { InteractiveHelpModelService } from './helpModelService';
import { InteractiveHelpVisualizationService } from './helpVisualizationService';
import { InteractiveHelpUserService } from './helpUserService';
import { InteractiveHelpClassService } from './helpClassService';
import { InteractiveHelpVocabularyService } from './helpVocabularyService';
import { InteractiveHelpPredicateService } from './helpPredicateService';
import { InteractiveHelpValidatorService } from './helpValidatorService';

export class InteractiveHelpService implements ResetableService {

  private _open = false;
  private _closing = false;

  private helpServices: ResetableService[];

  /* @ngInject */
  constructor(private $q: IQService,
              public helpModelService: InteractiveHelpModelService,
              public helpVisualizationService: InteractiveHelpVisualizationService,
              public helpUserService: InteractiveHelpUserService,
              public helpClassService: InteractiveHelpClassService,
              public helpPredicateService: InteractiveHelpPredicateService,
              public helpVocabularyService: InteractiveHelpVocabularyService,
              public helpValidatorService: InteractiveHelpValidatorService) {

    this.helpServices = [
      helpModelService,
      helpVisualizationService,
      helpUserService,
      helpClassService,
      helpPredicateService,
      helpVocabularyService,
      helpValidatorService
    ];
  }

  isClosing() {
    return this._closing;
  }

  isOpen() {
    return this._open;
  }

  isClosed() {
    return !this.isOpen() && !this.isClosing();
  }

  open() {
    this._open = true;
    this._closing = false;
  }

  close() {
    this._open = false;
    this._closing = true;
    setTimeout(() => this._closing = false);
  }

  reset(): IPromise<any> {
    return this.$q.all(this.helpServices.map(service => service.reset()));
  }
}
