import { IPromise, ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  StoryLine, InteractiveHelp, createNotification
} from './contract';
import { Model } from '../entities/model';
import { KnownModelType } from '../entities/type';
import { requireDefined } from '../utils/object';
import * as ModelPage from './pages/model/modelPageHelp.po';
import * as ModelView from './pages/model/modelViewHelp.po';
import * as ClassView from './pages/model/classViewHelp.po';
import {
  exampleImportedLibrary, exampleSpecializedOrAssignedClass, exampleNewClass, exampleProfile,
  exampleLibrary
} from './entities';
import { classIdFromNamespaceId, predicateIdFromNamespaceId, modelIdFromPrefix, isExpectedProperty } from './utils';
import { EntityLoaderService, EntityLoader, PropertyDetails } from '../services/entityLoader';
import { InteractiveHelpService } from './services/interactiveHelpService';
import gettextCatalog = angular.gettext.gettextCatalog;
import { Localizable } from '../entities/contract';
import { availableUILanguages } from '../utils/language';

function addNamespace(type: KnownModelType, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through requiring a namespace',
    description: 'This tutorial shows how to import new namespace to the model',
    items: () => [
      ModelPage.openModelDetails(type),
      ModelView.modifyModel(type),
      ...ModelPage.addNamespaceItems(gettextCatalog),
      ModelView.saveModelChanges,
      createNotification({
        title: 'Congratulations for completing namespace require!'
      })
    ]
  };
}

function specializeClass(namespaceId: string, className: string, selectProperties: string[], gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through specializing a class',
    description: 'This tutorial shows how to create a new shape from a class',
    items: () => [
      ...ModelPage.specializeClassItems(namespaceId, className, selectProperties, gettextCatalog),
      createNotification({
        title: 'Congratulations for completing specialize class!'
      })
    ]
  };
}

function assignClass(namespaceId: string, className: string, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through assigning class to a library',
    description: 'This tutorial shows how to add Class from existing library',
    items: () => [
      ...ModelPage.assignClassItems(namespaceId,  className, gettextCatalog),
      createNotification({
        title: 'Congratulations for completing class assignation!'
      })
    ]
  };
}

function addAttribute(modelPrefix: string, attributeNamespaceId: string, attributeName: string, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through adding an attribute',
    description: 'This tutorial shows how to add new attribute',
    items: () => [
      ModelPage.selectClass(modelIdFromPrefix(modelPrefix), exampleNewClass.name),
      ClassView.modifyClass,
      ...ModelPage.addAttributeItems(attributeNamespaceId, attributeName, gettextCatalog),
      ClassView.saveClassChanges,
      createNotification({
        title: 'Congratulations for completing adding an attribute!'
      })
    ]
  };
}

function createNewClass(className: string, classComment: string, attributeNamespaceId: string, attributeName: string, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through creating a class',
    description: 'This tutorial shows how to create a new Class',
    items: () => [
      ...ModelPage.createNewClassItems(className, classComment, attributeNamespaceId, attributeName, gettextCatalog),
      ClassView.saveClassChanges,
      createNotification({
        title: 'Congratulations for completing new class creation!'
      })
    ]
  };
}

function addAssociation(modelPrefix: string, searchName: string, name: string, comment: string, associationTargetNamespaceId: string, associationTargetName: string, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through adding an association',
    description: 'This tutorial shows how to add association to a Class',
    items: () => [
      ModelPage.selectClass(modelIdFromPrefix(modelPrefix), exampleNewClass.name),
      ClassView.modifyClass,
      ...ModelPage.addAssociationItems(searchName, name, comment, associationTargetNamespaceId, associationTargetName, gettextCatalog),
      createNotification({
        title: 'Congratulations for completing adding an association!'
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
    helps.add(createNewClass(exampleNewClass.name, exampleNewClass.comment, exampleNewClass.property.attribute.namespaceId, exampleNewClass.property.attribute.name, this.gettextCatalog), builder => builder.newModel(exampleImportedLibrary.namespaceId));

    if (isProfile) {
      helps.add(specializeClass(exampleImportedLibrary.namespaceId, exampleSpecializedOrAssignedClass.name, exampleSpecializedOrAssignedClass.properties, this.gettextCatalog), builder => builder.newModel(exampleImportedLibrary.namespaceId));
    } else {
      helps.add(assignClass(exampleImportedLibrary.namespaceId, exampleSpecializedOrAssignedClass.name, this.gettextCatalog), builder => builder.newModel(exampleImportedLibrary.namespaceId));
    }

    helps.add(addAttribute(modelPrefix, exampleNewClass.property.attribute.namespaceId, exampleNewClass.property.attribute.name, this.gettextCatalog), builder => {
      builder.newModel(exampleImportedLibrary.namespaceId);
      builder.newClass();
    });

    helps.add(addAssociation(
      modelPrefix,
      exampleNewClass.property.association.searchName,
      exampleNewClass.property.association.name,
      exampleNewClass.property.association.comment,
      associationNamespaceId,
      exampleSpecializedOrAssignedClass.name,
      this.gettextCatalog
    ), builder => {
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
