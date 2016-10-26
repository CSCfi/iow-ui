import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  StoryLine, InteractiveHelp, createNotification
} from './contract';
import { openModelDetails } from './pages/model/modelPageHelp.po';
import {
  requireNamespace, saveModelChanges, modifyModel
} from './pages/model/modelViewHelp.po';
import { filterForJhs, selectJhsResult } from './pages/model/modal/addEditNamepaceModalHelp.po';
import { Model } from '../entities/model';
import { InteractiveHelpService } from './services/interactiveHelpService';
import { KnownModelType } from '../entities/type';
import { assertNever } from '../utils/object';

export const addNamespaceItems = [
  requireNamespace,
  filterForJhs,
  selectJhsResult
];

const finishedCreateNewModelNotification = createNotification({
  title: 'Congratulations for completing namespace require!',
  content: 'Diipadaa'
});

export function addNamespace(type: KnownModelType) {
  return {
    title: 'Guide through requiring a namespace',
    description: 'Diipadaa',
    items: [
      openModelDetails(type),
      modifyModel(type),
      ...addNamespaceItems,
      saveModelChanges,
      finishedCreateNewModelNotification
    ]
  };
}

export class ModelPageHelpService {

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService, private $location: ILocationService) {
  }

  private returnToModelPage(model: Model) {
    this.$uibModalStack.dismissAll();
    this.$location.url(model.iowUrl());
  }

  private initialize(model: Model) {

    return (service: InteractiveHelpService) => {

      const createModelAndNavigate = (prefix: string, label: string) => {
        return service.helpModelService.newModel(prefix, label, model.groupId, model.language, model.normalizedType)
          .then(newModel => {
            service.helpModelService.createModel(newModel);
            this.$location.url(newModel.iowUrl());
            return true;
          });
      };

      return service.reset().then(() => {
        switch (model.normalizedType) {
          case 'library':
            return createModelAndNavigate('testi', 'Testikirjasto');
          case 'profile':
            return createModelAndNavigate('plv', 'Palveluprofiili');
          default:
            return assertNever(model.normalizedType, 'Unknown model type');
        }
      });
    };
  }

  private createHelp(model: Model, storyLine: StoryLine) {
    return {
      storyLine,
      onInit: this.initialize(model),
      onComplete: () => this.returnToModelPage(model),
      onCancel: () => this.returnToModelPage(model)
    };
  }

  getHelps(model: Model|null): InteractiveHelp[] {

    if (!model) {
      return [];
    }

    return [
      this.createHelp(model, addNamespace(model.normalizedType))
    ];
  }
}
