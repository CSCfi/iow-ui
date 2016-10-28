import { IQService, ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  StoryLine, InteractiveHelp, createNotification
} from './contract';
import { Model } from '../entities/model';
import { InteractiveHelpService } from './services/interactiveHelpService';
import { KnownModelType } from '../entities/type';
import { assertNever, requireDefined } from '../utils/object';
import * as ModelPage from './pages/model/modelPageHelp.po';
import * as ModelView from './pages/model/modelViewHelp.po';
import * as SearchNamespaceModal from './pages/model/modal/searchNamepaceModalHelp.po';
import * as SearchClassModal from './pages/model/modal/searchClassModalHelp.po';
import * as SearchPredicateModal from './pages/model/modal/searchPredicateModalHelp.po';
import * as AddPropertiesFromClass from './pages/model/modal/addPropertiesFromClassModalHelp.po';
import * as ClassView from './pages/model/classViewHelp.po';
import * as SearchConceptModal from './pages/model/modal/searchConceptModalHelp.po';

export const addNamespaceItems = [
  ModelView.requireNamespace,
  SearchNamespaceModal.filterForModel('jhs', 'julkis'),
  SearchNamespaceModal.selectNamespace('jhs'),
  ModelView.focusNamespaces
];

export function addNamespace(type: KnownModelType) {
  return {
    title: 'Guide through requiring a namespace',
    description: 'Diipadaa',
    items: [
      ModelPage.openModelDetails(type),
      ModelView.modifyModel(type),
      ...addNamespaceItems,
      ModelView.saveModelChanges,
      createNotification({
        title: 'Congratulations for completing namespace require!',
        content: 'Diipadaa'
      })
    ]
  };
}

const palveluNimiId = '6cfbd054-2bfc-4e92-8642-477b035f59ee';
const palveluKuvausId = 'fe884237-f6e2-44ea-ac97-231516da4770';

export const specializeClassItems = [
  ModelPage.openAddResource('class'),
  SearchClassModal.filterForClass('jhs', 'Palvelu', 'palv'),
  SearchClassModal.selectClass('jhs', 'Palvelu'),
  SearchClassModal.focusSelectedClass,
  SearchClassModal.confirmClassSelection,
  AddPropertiesFromClass.selectProperties('Select name and description', [palveluNimiId, palveluKuvausId]),
  AddPropertiesFromClass.confirmProperties(true),
  ClassView.focusClass,
  ClassView.saveClassChanges
];

export const specializeClass = {
  title: 'Guide through specializing a class',
  description: 'Diipadaa',
  items: [
    ...specializeClassItems,
    createNotification({
      title: 'Congratulations for completing specialize class!',
      content: 'Diipadaa'
    })
  ]
};

export const createNewClassItems = [
  ModelPage.openAddResource('class'),
  SearchClassModal.filterForNewClass('Tuote'),
  SearchClassModal.selectAddNewClassSearchResult,
  SearchConceptModal.filterForConceptSuggestionConcept('Tuote'),
  SearchConceptModal.addConceptSuggestionSearchResult,
  SearchConceptModal.enterVocabulary,
  SearchConceptModal.enterLabel,
  SearchConceptModal.enterDefinition,
  SearchConceptModal.confirmConceptSelection,
  ClassView.focusClass,
  ClassView.addProperty,
  SearchPredicateModal.filterForPredicate('jhs', 'Nimi', 'nimi'),
  SearchPredicateModal.selectPredicate('jhs', 'Nimi'),
  SearchPredicateModal.focusSelectedPredicate,
  SearchPredicateModal.confirmPredicateSelection(true),
  ClassView.focusOpenProperty,
  ClassView.saveClassChanges
];

export const createNewClass = {
  title: 'Guide through creating a class',
  description: 'Diipadaa',
  items: [
    ...createNewClassItems,
    createNotification({
      title: 'Congratulations for completing new class creation!',
      content: 'Diipadaa'
    })
  ]
};

export class ModelPageHelpService {

  /* @ngInject */
  constructor(private $q: IQService, private $uibModalStack: IModalStackService, private $location: ILocationService) {
  }

  private returnToModelPage(model: Model) {
    this.$uibModalStack.dismissAll();
    this.$location.url(model.iowUrl());
  }

  private initialize(model: Model, requirePrefix?: string) {

    return (service: InteractiveHelpService) => {

      const persistModel = (newModel: Model) => {
        service.helpModelService.createModel(newModel);
        return newModel;
      };

      const addNamespace = (newModel: Model) => {
        if (requirePrefix) {
          return service.helpModelService.getAllImportableNamespaces()
            .then(namespaces => {

              const jhs = requireDefined(namespaces.find(ns => ns.prefix === requirePrefix));
              newModel.addNamespace(jhs);

              return newModel;
            });
        } else {
          return this.$q.when(newModel);
        }
      };

      const navigate = (newModel: Model) => {
        this.$location.url(newModel.iowUrl());
        return true;
      };

      const createModelAndNavigate = (prefix: string, label: string) => {
        return service.helpModelService.newModel(prefix, label, model.groupId, model.language, model.normalizedType)
          .then(addNamespace)
          .then(persistModel)
          .then(navigate);
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

  private createHelp(model: Model, storyLine: StoryLine, requirePrefix?: string) {
    return {
      storyLine,
      onInit: this.initialize(model, requirePrefix),
      onComplete: () => this.returnToModelPage(model),
      onCancel: () => this.returnToModelPage(model)
    };
  }

  getHelps(model: Model|null): InteractiveHelp[] {

    if (!model) {
      return [];
    }

    const result = [
      this.createHelp(model, addNamespace(model.normalizedType)),
      this.createHelp(model, createNewClass, 'jhs')
    ];

    switch (model.normalizedType) {
      case 'profile':
        result.push(this.createHelp(model, specializeClass, 'jhs'));
        break;
      case 'library':
        break;
      default:
        assertNever(model.normalizedType, 'Unsupported model type');
    }

    return result;
  }
}
