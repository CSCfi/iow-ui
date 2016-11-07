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
  exampleImportedLibrary, exampleSpecializedOrAssignedClass, exampleNewClass, exampleProfile,
  exampleLibrary
} from './entities';
import { classIdFromNamespaceId, predicateIdFromNamespaceId, modelIdFromPrefix, isExpectedProperty } from './utils';
import { classView } from './selectors';
import { EntityLoaderService, EntityLoader, PropertyDetails } from '../services/entityLoader';
import { InteractiveHelpService } from './services/interactiveHelpService';
import gettextCatalog = angular.gettext.gettextCatalog;
import { Localizable } from '../entities/contract';
import { availableUILanguages } from '../utils/language';

export function addNamespaceItems(gettextCatalog: gettextCatalog): Story[] {
  return [
    ModelView.requireNamespace,
    SearchNamespaceModal.filterForModel(exampleImportedLibrary.prefix, exampleImportedLibrary.namespaceId, gettextCatalog),
    SearchNamespaceModal.selectNamespace(exampleImportedLibrary.prefix, exampleImportedLibrary.namespaceId),
    ModelView.focusNamespaces
  ];
}

export function addNamespace(type: KnownModelType, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through requiring a namespace',
    description: 'Diipadaa',
    items: () => [
      ModelPage.openModelDetails(type),
      ModelView.modifyModel(type),
      ...addNamespaceItems(gettextCatalog),
      ModelView.saveModelChanges,
      createNotification({
        title: 'Congratulations for completing namespace require!',
        content: 'Diipadaa'
      })
    ]
  };
}

export function specializeClassItems(gettextCatalog: gettextCatalog): Story[] {
  return [
    ModelPage.openAddResource('class'),
    SearchClassModal.filterForClass(exampleImportedLibrary.namespaceId, exampleSpecializedOrAssignedClass.name, gettextCatalog),
    SearchClassModal.selectClass(exampleImportedLibrary.namespaceId, exampleSpecializedOrAssignedClass.name),
    SearchClassModal.focusSelectedClass,
    SearchClassModal.confirmClassSelection(false),
    AddPropertiesFromClass.selectProperties('Select name and description', exampleSpecializedOrAssignedClass.properties),
    AddPropertiesFromClass.confirmProperties(true),
    ClassForm.focusClass(classView),
    ClassView.saveClassChanges
  ];
}

export function specializeClass(gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through specializing a class',
    description: 'Diipadaa',
    items: () => [
      ...specializeClassItems(gettextCatalog),
      createNotification({
        title: 'Congratulations for completing specialize class!',
        content: 'Diipadaa'
      })
    ]
  };
}

export function assignClassItems(gettextCatalog: gettextCatalog): Story[] {
  return [
    ModelPage.openAddResource('class'),
    SearchClassModal.filterForClass(exampleImportedLibrary.namespaceId, exampleSpecializedOrAssignedClass.name, gettextCatalog),
    SearchClassModal.selectClass(exampleImportedLibrary.namespaceId, exampleSpecializedOrAssignedClass.name),
    SearchClassModal.focusSelectedClass,
    SearchClassModal.confirmClassSelection(true),
    ClassForm.focusClass(classView)
  ];
}

export function assignClass(gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through assigning class to a library',
    description: 'Diipadaa',
    items: () => [
      ...assignClassItems(gettextCatalog),
      createNotification({
        title: 'Congratulations for completing class assignation!',
        content: 'Diipadaa'
      })
    ]
  };
}

function addAttributeItems(gettextCatalog: gettextCatalog): Story[] {
  return [
    ClassView.addProperty,
    SearchPredicateModal.filterForPredicate(exampleNewClass.property.attribute.namespaceId, exampleNewClass.property.attribute.name, gettextCatalog),
    SearchPredicateModal.selectPredicate(exampleNewClass.property.attribute.namespaceId, exampleNewClass.property.attribute.name),
    SearchPredicateModal.focusSelectedAttribute,
    SearchPredicateModal.confirmPredicateSelection(true),
    ClassForm.focusOpenProperty(classView)
  ];
}

export function addAttribute(modelPrefix: string, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through adding an attribute',
    description: 'Diipadaa',
    items: () => [
      ModelPage.selectClass(modelIdFromPrefix(modelPrefix), exampleNewClass.name),
      ClassView.modifyClass,
      ...addAttributeItems(gettextCatalog),
      ClassView.saveClassChanges,
      createNotification({
        title: 'Congratulations for completing adding an attribute!',
        content: 'Diipadaa'
      })
    ]
  };
}

export function createNewClassItems(gettextCatalog: gettextCatalog): Story[] {
  return [
    ModelPage.openAddResource('class'),
    SearchClassModal.filterForNewClass(exampleNewClass.name, gettextCatalog),
    SearchClassModal.selectAddNewClassSearchResult,
    SearchConceptModal.filterForConceptSuggestionConcept(exampleNewClass.name, gettextCatalog),
    SearchConceptModal.addConceptSuggestionSearchResult,
    SearchConceptModal.enterVocabulary,
    SearchConceptModal.enterLabel,
    SearchConceptModal.enterDefinition(exampleNewClass.comment, gettextCatalog),
    SearchConceptModal.confirmConceptSelection(true),
    ClassForm.focusClass(classView),
    ...addAttributeItems(gettextCatalog)
  ];
}

export function createNewClass(gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through creating a class',
    description: 'Diipadaa',
    items: () => [
      ...createNewClassItems(gettextCatalog),
      ClassView.saveClassChanges,
      createNotification({
        title: 'Congratulations for completing new class creation!',
        content: 'Diipadaa'
      })
    ]
  };
}

export function addAssociationItems(namespaceId: string, gettextCatalog: gettextCatalog): Story[] {
  return [
    ClassView.addProperty,
    SearchPredicateModal.filterForNewPredicate(exampleNewClass.property.association.searchName, gettextCatalog),
    SearchPredicateModal.selectAddNewPredicateSearchResult('association'),
    SearchConceptModal.filterForConceptSuggestionConcept(exampleNewClass.property.association.searchName, gettextCatalog),
    SearchConceptModal.addConceptSuggestionSearchResult,
    SearchConceptModal.enterVocabulary,
    SearchConceptModal.enterLabel,
    SearchConceptModal.enterDefinition(exampleNewClass.property.association.comment, gettextCatalog),
    SearchConceptModal.confirmConceptSelection(false),
    SearchPredicateModal.focusSelectedAssociation,
    PredicateForm.focusPredicateLabel(SearchPredicateModal.searchPredicateModalElement, 'association', 'Label can be changed'),
    PredicateForm.enterPredicateLabel(SearchPredicateModal.searchPredicateModalElement, 'association', exampleNewClass.property.association.name, gettextCatalog),
    SearchPredicateModal.confirmPredicateSelection(true),
    ClassForm.focusOpenProperty(classView),
    ClassForm.selectAssociationTarget(classView),
    SearchClassModal.filterForClass(namespaceId, exampleSpecializedOrAssignedClass.name, gettextCatalog),
    SearchClassModal.selectClass(namespaceId, exampleSpecializedOrAssignedClass.name),
    SearchClassModal.focusSelectedClass,
    SearchClassModal.confirmClassSelection(false),
    ClassForm.focusAssociationTarget(classView),
    ClassView.saveClassChanges,
    VisualizationView.focusVisualization
  ];
}

export function addAssociation(modelPrefix: string, associationTargetNamespaceId: string, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through adding an association',
    description: 'Diipadaa',
    items: () => [
      ModelPage.selectClass(modelIdFromPrefix(modelPrefix), exampleNewClass.name),
      ClassView.modifyClass,
      ...addAssociationItems(associationTargetNamespaceId, gettextCatalog),
      createNotification({
        title: 'Congratulations for completing adding an association!',
        content: 'Diipadaa'
      })
    ]
  };
}

export class ModelPageHelpService {

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService,
              private $location: ILocationService,
              private entityLoaderService: EntityLoaderService,
              private gettextCatalog: gettextCatalog) {
  }

  private asLocalizable(key: string) {
    const result: Localizable = {};

    for (const language of availableUILanguages) {
      result[language] = this.gettextCatalog.getString(key);
    }

    return result;
  }

  getHelps(model: Model|null): InteractiveHelp[] {

    if (!model) {
      return [];
    }

    const helps = new HelpBuilder(this.$location, this.$uibModalStack, this.entityLoaderService, this.asLocalizable.bind(this), model);
    const isProfile = model.normalizedType === 'profile';
    const modelPrefix = isProfile ? exampleProfile.prefix : exampleLibrary.prefix;
    const associationNamespaceId = isProfile ? modelIdFromPrefix(exampleProfile.prefix)
                                             : exampleImportedLibrary.namespaceId;

    helps.add(addNamespace(model.normalizedType, this.gettextCatalog), builder => builder.newModel());
    helps.add(createNewClass(this.gettextCatalog), builder => builder.newModel(exampleImportedLibrary.namespaceId));

    if (isProfile) {
      helps.add(specializeClass(this.gettextCatalog), builder => builder.newModel(exampleImportedLibrary.namespaceId));
    } else {
      helps.add(assignClass(this.gettextCatalog), builder => builder.newModel(exampleImportedLibrary.namespaceId));
    }

    helps.add(addAttribute(modelPrefix, this.gettextCatalog), builder => {
      builder.newModel(exampleImportedLibrary.namespaceId);
      builder.newClass();
    });

    helps.add(addAssociation(modelPrefix, associationNamespaceId, this.gettextCatalog), builder => {
      builder.newModel(exampleImportedLibrary.namespaceId);
      builder.newClass({
        label: this.asLocalizable(exampleNewClass.name),
        predicate: predicateIdFromNamespaceId(exampleNewClass.property.attribute.namespaceId, exampleNewClass.property.attribute.name)
      });

      if (isProfile) {
        builder.specializeClass();
      } else {
        builder.assignClass();
      }
    });

    return helps.result;
  }
}


class ModelBuilder {

  private model?: IPromise<Model>;

  constructor(private entityLoader: EntityLoader,
              private contextModel: Model,
              private asLocalizable: (key: string) => Localizable) {
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
      label: this.asLocalizable(label),
      namespaces: namespaces
    });

    return this.model;
  }

  newClass(...properties: PropertyDetails[]) {
    return this.entityLoader.createClass(requireDefined(this.model), {
      label: this.asLocalizable(exampleNewClass.name),
      comment: this.asLocalizable(exampleNewClass.comment),
      properties
    });
  }

  assignClass() {

    const model = requireDefined(this.model);
    const classToAssign = this.entityLoader.getClass(model, classIdFromNamespaceId(exampleSpecializedOrAssignedClass.namespaceId, exampleSpecializedOrAssignedClass.name));

    return this.entityLoader.assignClass(model, classToAssign);
  }

  specializeClass() {
    return this.entityLoader.specializeClass(requireDefined(this.model), {
      class: classIdFromNamespaceId(exampleSpecializedOrAssignedClass.namespaceId, exampleSpecializedOrAssignedClass.name),
      propertyFilter: isExpectedProperty(exampleSpecializedOrAssignedClass.properties)
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
              private asLocalizable: (key: string) => Localizable,
              private contextModel: Model) {
  }

  add(storyLine: StoryLine, initializer: (builder: ModelBuilder) => void) {

    const model = this.contextModel;

    this.result.push({
      storyLine,
      onInit: (service: InteractiveHelpService) => {

        const builder = new ModelBuilder(this.entityLoaderService.create(model.context, false), model, this.asLocalizable);

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
