import { IQService, ILocationService, IPromise, ui } from 'angular';
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
import {
  exampleImportedLibrary, exampleSpecializedClass, exampleNewClass, exampleProfile,
  exampleLibrary
} from './entities';
import { classIdFromPrefixAndName, onlyProperties } from './utils';
import { Uri } from '../entities/uri';

export const addNamespaceItems = [
  ModelView.requireNamespace,
  SearchNamespaceModal.filterForModel(exampleImportedLibrary.prefix, 'julkis'),
  SearchNamespaceModal.selectNamespace(exampleImportedLibrary.prefix),
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

export const specializeClassItems = [
  ModelPage.openAddResource('class'),
  SearchClassModal.filterForClass(exampleImportedLibrary.prefix, exampleSpecializedClass.name, 'palv'),
  SearchClassModal.selectClass(exampleImportedLibrary.prefix, exampleSpecializedClass.name),
  SearchClassModal.focusSelectedClass,
  SearchClassModal.confirmClassSelection,
  AddPropertiesFromClass.selectProperties('Select name and description', exampleSpecializedClass.properties),
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
  SearchClassModal.filterForNewClass(exampleNewClass.name),
  SearchClassModal.selectAddNewClassSearchResult,
  SearchConceptModal.filterForConceptSuggestionConcept(exampleNewClass.name),
  SearchConceptModal.addConceptSuggestionSearchResult,
  SearchConceptModal.enterVocabulary,
  SearchConceptModal.enterLabel,
  SearchConceptModal.enterDefinition,
  SearchConceptModal.confirmConceptSelection,
  ClassView.focusClass,
  ClassView.addProperty,
  SearchPredicateModal.filterForPredicate(exampleNewClass.property.prefix, exampleNewClass.property.name, 'nimi'),
  SearchPredicateModal.selectPredicate(exampleNewClass.property.prefix, exampleNewClass.property.name),
  SearchPredicateModal.focusSelectedAttribute,
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

export const addAssociationItems = [

];

export const addAssociation = {
  title: 'Guide through adding an association',
  description: 'Diipadaa',
  items: [
    ...addAssociationItems,
    createNotification({
      title: 'Congratulations for completing adding an association!',
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

  private initialize(model: Model, requirePrefix: string|null, createClasses: boolean) {

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

      const addClasses = (newModel: Model) => {
        if (createClasses) {

          const resultPromises: IPromise<any>[] = [];
          const shapeFromClassId = new Uri(classIdFromPrefixAndName(exampleImportedLibrary.prefix, exampleSpecializedClass.name), newModel.context);

          resultPromises.push(
            service.helpClassService.getClass(shapeFromClassId, newModel)
              .then(klass => service.helpClassService.newShape(klass, newModel, false, 'fi'))
              .then(shape => {
                onlyProperties(shape.properties, exampleSpecializedClass.properties);
                return shape;
              })
              .then(shape => service.helpClassService.createClass(shape))
          );

          resultPromises.push(
            service.helpVocabularyService.createConceptSuggestion(newModel.vocabularies[0], exampleNewClass.name, exampleNewClass.comment, null, 'fi', newModel)
              .then(suggestionId => service.helpClassService.newClass(newModel, exampleNewClass.name, suggestionId, 'fi'))
              .then(klass => service.helpClassService.createClass(klass))
          );

          return this.$q.all(resultPromises).then(() => newModel);

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
          .then(addClasses)
          .then(navigate);
      };

      return service.reset().then(() => {
        switch (model.normalizedType) {
          case 'library':
            return createModelAndNavigate(exampleLibrary.prefix, exampleLibrary.name);
          case 'profile':
            return createModelAndNavigate(exampleProfile.prefix, exampleProfile.name);
          default:
            return assertNever(model.normalizedType, 'Unknown model type');
        }
      });
    };
  }

  private createHelp(model: Model, storyLine: StoryLine, requirePrefix: string|null, createClasses: boolean) {
    return {
      storyLine,
      onInit: this.initialize(model, requirePrefix, createClasses),
      onComplete: () => this.returnToModelPage(model),
      onCancel: () => this.returnToModelPage(model)
    };
  }

  getHelps(model: Model|null): InteractiveHelp[] {

    if (!model) {
      return [];
    }

    const result = [
      this.createHelp(model, addNamespace(model.normalizedType), null, false),
      this.createHelp(model, createNewClass, exampleImportedLibrary.prefix, false),
      this.createHelp(model, addAssociation, exampleImportedLibrary.prefix, true)
    ];

    switch (model.normalizedType) {
      case 'profile':
        result.push(this.createHelp(model, specializeClass, exampleImportedLibrary.prefix, false));
        break;
      case 'library':
        break;
      default:
        assertNever(model.normalizedType, 'Unsupported model type');
    }

    return result;
  }
}
