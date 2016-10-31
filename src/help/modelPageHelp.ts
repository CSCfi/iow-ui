import { IPromise, ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  StoryLine, InteractiveHelp, createNotification, Story
} from './contract';
import { Model } from '../entities/model';
import { KnownModelType } from '../entities/type';
import { requireDefined } from '../utils/object';
import * as ModelPage from './pages/model/modelPageHelp.po';
import * as ModelView from './pages/model/modelViewHelp.po';
import * as SearchNamespaceModal from './pages/model/modal/searchNamepaceModalHelp.po';
import * as SearchClassModal from './pages/model/modal/searchClassModalHelp.po';
import * as SearchPredicateModal from './pages/model/modal/searchPredicateModalHelp.po';
import * as AddPropertiesFromClass from './pages/model/modal/addPropertiesFromClassModalHelp.po';
import * as ClassView from './pages/model/classViewHelp.po';
import * as SearchConceptModal from './pages/model/modal/searchConceptModalHelp.po';
import * as PredicateForm from './pages/model/predicateFormHelp.po';
import * as ClassForm from './pages/model/classFormHelp.po';
import * as VisualizationView from './pages/model/visualizationViewHelp.po';
import {
  exampleImportedLibrary, exampleSpecializedClass, exampleNewClass, exampleProfile,
  exampleLibrary
} from './entities';
import { classIdFromNamespaceId, predicateIdFromNamespaceId, modelIdFromPrefix, isExpectedProperty } from './utils';
import { classView } from './selectors';
import { EntityLoaderService, EntityLoader, PropertyDetails } from '../services/entityLoader';
import { InteractiveHelpService } from './services/interactiveHelpService';

export const addNamespaceItems: Story[] = [
  ModelView.requireNamespace,
  SearchNamespaceModal.filterForModel(exampleImportedLibrary.prefix, exampleImportedLibrary.namespaceId, 'julkis'),
  SearchNamespaceModal.selectNamespace(exampleImportedLibrary.prefix, exampleImportedLibrary.namespaceId),
  ModelView.focusNamespaces
];

export function addNamespace(type: KnownModelType): StoryLine {
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

export const specializeClassItems: Story[] = [
  ModelPage.openAddResource('class'),
  SearchClassModal.filterForClass(exampleImportedLibrary.namespaceId, exampleSpecializedClass.name, 'palv'),
  SearchClassModal.selectClass(exampleImportedLibrary.namespaceId, exampleSpecializedClass.name),
  SearchClassModal.focusSelectedClass,
  SearchClassModal.confirmClassSelection,
  AddPropertiesFromClass.selectProperties('Select name and description', exampleSpecializedClass.properties),
  AddPropertiesFromClass.confirmProperties(true),
  ClassForm.focusClass(classView),
  ClassView.saveClassChanges
];

export const specializeClass: StoryLine = {
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


const addAttributeItems: Story[] = [
  ClassView.addProperty,
  SearchPredicateModal.filterForPredicate(exampleNewClass.property.attribute.namespaceId, exampleNewClass.property.attribute.name, 'nimi'),
  SearchPredicateModal.selectPredicate(exampleNewClass.property.attribute.namespaceId, exampleNewClass.property.attribute.name),
  SearchPredicateModal.focusSelectedAttribute,
  SearchPredicateModal.confirmPredicateSelection(true),
  ClassForm.focusOpenProperty(classView)
];

export function addAttribute(modelPrefix: string): StoryLine {
  return {
    title: 'Guide through adding an attribute',
    description: 'Diipadaa',
    items: [
      ModelPage.selectClass(modelIdFromPrefix(modelPrefix), exampleNewClass.name),
      ClassView.modifyClass,
      ...addAttributeItems,
      ClassView.saveClassChanges,
      createNotification({
        title: 'Congratulations for completing adding an attribute!',
        content: 'Diipadaa'
      })
    ]
  };
}

export const createNewClassItems: Story[] = [
  ModelPage.openAddResource('class'),
  SearchClassModal.filterForNewClass(exampleNewClass.name),
  SearchClassModal.selectAddNewClassSearchResult,
  SearchConceptModal.filterForConceptSuggestionConcept(exampleNewClass.name),
  SearchConceptModal.addConceptSuggestionSearchResult,
  SearchConceptModal.enterVocabulary,
  SearchConceptModal.enterLabel,
  SearchConceptModal.enterDefinition(exampleNewClass.comment),
  SearchConceptModal.confirmConceptSelection(true),
  ClassForm.focusClass(classView),
  ...addAttributeItems
];

export const createNewClass: StoryLine = {
  title: 'Guide through creating a class',
  description: 'Diipadaa',
  items: [
    ...createNewClassItems,
    ClassView.saveClassChanges,
    createNotification({
      title: 'Congratulations for completing new class creation!',
      content: 'Diipadaa'
    })
  ]
};

export const addAssociationItems: Story[] = [
  ClassView.addProperty,
  SearchPredicateModal.filterForNewPredicate(exampleNewClass.property.association.searchName),
  SearchPredicateModal.selectAddNewPredicateSearchResult('association'),
  SearchConceptModal.filterForConceptSuggestionConcept(exampleNewClass.property.association.searchName),
  SearchConceptModal.addConceptSuggestionSearchResult,
  SearchConceptModal.enterVocabulary,
  SearchConceptModal.enterLabel,
  SearchConceptModal.enterDefinition(exampleNewClass.property.association.comment),
  SearchConceptModal.confirmConceptSelection(false),
  SearchPredicateModal.focusSelectedAssociation,
  PredicateForm.focusPredicateLabel(SearchPredicateModal.searchPredicateModalElement, 'association', 'Label can be changed'),
  PredicateForm.enterPredicateLabel(SearchPredicateModal.searchPredicateModalElement, 'association', exampleNewClass.property.association.name),
  SearchPredicateModal.confirmPredicateSelection(true),
  ClassForm.focusOpenProperty(classView),
  ClassForm.selectAssociationTarget(classView),
  SearchClassModal.filterForClass(modelIdFromPrefix(exampleProfile.prefix), exampleSpecializedClass.name, exampleSpecializedClass.name),
  SearchClassModal.selectClass(modelIdFromPrefix(exampleProfile.prefix), exampleSpecializedClass.name),
  SearchClassModal.focusSelectedClass,
  SearchClassModal.confirmClassSelection,
  ClassForm.focusAssociationTarget(classView),
  ClassView.saveClassChanges,
  VisualizationView.focusVisualization
];

export const addAssociation: StoryLine = {
  title: 'Guide through adding an association',
  description: 'Diipadaa',
  items: [
    ModelPage.selectClass(modelIdFromPrefix(exampleProfile.prefix), exampleNewClass.name),
    ClassView.modifyClass,
    ...addAssociationItems,
    createNotification({
      title: 'Congratulations for completing adding an association!',
      content: 'Diipadaa'
    })
  ]
};

export class ModelPageHelpService {

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService,
              private $location: ILocationService,
              private entityLoaderService: EntityLoaderService) {
  }


  getHelps(model: Model|null): InteractiveHelp[] {

    if (!model) {
      return [];
    }

    const helps = new HelpBuilder(this.$location, this.$uibModalStack, this.entityLoaderService, model);
    const isProfile = model.normalizedType === 'profile';

    helps.add(addNamespace(model.normalizedType), builder => builder.newModel());
    helps.add(createNewClass, builder => builder.newModel(exampleImportedLibrary.namespaceId));

    if (isProfile) {
      helps.add(specializeClass, builder => builder.newModel(exampleImportedLibrary.namespaceId));
    }

    helps.add(addAttribute(isProfile ? exampleProfile.prefix : exampleLibrary.prefix), builder => {
      builder.newModel(exampleImportedLibrary.namespaceId);
      builder.newClass();
    });

    if (isProfile) {
      helps.add(addAssociation, builder => {
        builder.newModel(exampleImportedLibrary.namespaceId);
        builder.newClass({
          label: { 'fi': exampleNewClass.name },
          predicate: predicateIdFromNamespaceId(exampleNewClass.property.attribute.namespaceId, exampleNewClass.property.attribute.name)
        });
        builder.specializeClass();
      });
    }

    return helps.result;
  }
}


class ModelBuilder {

  private model?: IPromise<Model>;

  constructor(private entityLoader: EntityLoader, private contextModel: Model) {
  }

  newModel(...namespaces: string[]) {

    if (this.model) {
      throw new Error('Duplicate model initialization');
    }

    const type = this.contextModel.normalizedType;
    const prefix = type === 'library' ? exampleLibrary.prefix : exampleProfile.prefix;
    const label = type === 'library' ? exampleLibrary.name : exampleProfile.name;

    this.model = this.entityLoader.createModel(type, this.contextModel.groupId, {
      prefix,
      label: { fi: label },
      namespaces: namespaces
    });

    return this.model;
  }

  newClass(...properties: PropertyDetails[]) {
    return this.entityLoader.createClass(requireDefined(this.model), {
      label: { fi: exampleNewClass.name },
      comment: { fi: exampleNewClass.comment },
      properties
    });
  }

  specializeClass() {
    return this.entityLoader.specializeClass(requireDefined(this.model), {
      class: classIdFromNamespaceId(exampleImportedLibrary.namespaceId, exampleSpecializedClass.name),
      propertyFilter: isExpectedProperty(exampleSpecializedClass.properties)
    });
  }

  get result(): IPromise<Model> {
    return this.entityLoader.result.then(() => requireDefined(this.model));
  }
}

class HelpBuilder {

  result: InteractiveHelp[] = [];

  constructor(private $location: ILocationService,
              private $uibModalStack: IModalStackService,
              private entityLoaderService: EntityLoaderService,
              private contextModel: Model) {
  }

  add(storyLine: StoryLine, initializer: (builder: ModelBuilder) => void) {

    const model = this.contextModel;

    this.result.push({
      storyLine,
      onInit: (service: InteractiveHelpService) => {

        const builder = new ModelBuilder(this.entityLoaderService.create(model.context, false), model);

        return service.reset()
          .then(() => {
            initializer(builder);
            return builder.result;
          })
        .then(this.navigate.bind(this));
      },
      onComplete: () => this.returnToModelPage(model),
      onCancel: () => this.returnToModelPage(model)
    });
  };

  private returnToModelPage(model: Model) {
    this.$uibModalStack.dismissAll();
    this.$location.url(model.iowUrl());
  }

  private navigate(newModel: Model) {
    this.$location.url(newModel.iowUrl());
    return true;
  };
}
