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
import { exampleProfile, exampleLibrary } from './entities';
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

function addAttribute(modelPrefix: string, className: string, attributeNamespaceId: string, attributeName: string, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through adding an attribute',
    description: 'This tutorial shows how to add new attribute',
    items: () => [
      ModelPage.selectClass(modelIdFromPrefix(modelPrefix), className),
      ClassView.modifyClass,
      ...ModelPage.addPropertyUsingExistingPredicateItems(attributeNamespaceId, attributeName, gettextCatalog),
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

function addAssociation(modelPrefix: string, className: string, searchName: string, name: string, comment: string, associationTargetNamespaceId: string, associationTargetName: string, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: 'Guide through adding an association',
    description: 'This tutorial shows how to add association to a Class',
    items: () => [
      ModelPage.selectClass(modelIdFromPrefix(modelPrefix), className),
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

    if (isProfile) {

      helps.add(addNamespace(model.normalizedType, this.gettextCatalog), builder => {
        builder.newModel(exampleProfile.prefix, exampleProfile.name);
      });

      helps.add(createNewClass(
        exampleProfile.newClass.name,
        exampleProfile.newClass.comment,
        exampleProfile.newClass.property.attribute.namespaceId,
        exampleProfile.newClass.property.attribute.name, this.gettextCatalog), builder => {
          builder.newModel(exampleProfile.prefix, exampleProfile.name, exampleProfile.importedLibrary.namespaceId);
        }
      );

      helps.add(specializeClass(
        exampleProfile.importedLibrary.namespaceId,
        exampleProfile.specializedClass.name,
        exampleProfile.specializedClass.properties,
        this.gettextCatalog), builder => {
          builder.newModel(exampleProfile.prefix, exampleProfile.name, exampleProfile.importedLibrary.namespaceId);
        }
      );

      helps.add(addAttribute(
        exampleProfile.prefix,
        exampleProfile.newClass.name,
        exampleProfile.newClass.property.attribute.namespaceId,
        exampleProfile.newClass.property.attribute.name,
        this.gettextCatalog), builder => {
          builder.newModel(exampleProfile.prefix, exampleProfile.name, exampleProfile.importedLibrary.namespaceId);
          builder.newClass(exampleProfile.newClass.name, exampleProfile.newClass.comment);
        }
      );

      helps.add(addAssociation(
        exampleProfile.prefix,
        exampleProfile.newClass.name,
        exampleProfile.newClass.property.association.searchName,
        exampleProfile.newClass.property.association.name,
        exampleProfile.newClass.property.association.comment,
        modelIdFromPrefix(exampleProfile.prefix),
        exampleProfile.specializedClass.name,
        this.gettextCatalog), builder => {
          builder.newModel(exampleProfile.prefix, exampleProfile.name, exampleProfile.importedLibrary.namespaceId);
          builder.newClass(exampleProfile.newClass.name, exampleProfile.newClass.comment, {
            label: this.asLocalizable(exampleProfile.newClass.name),
            predicate: predicateIdFromNamespaceId(exampleProfile.newClass.property.attribute.namespaceId, exampleProfile.newClass.property.attribute.name)
          });
          builder.specializeClass(exampleProfile.specializedClass.namespaceId, exampleProfile.specializedClass.namespaceId, exampleProfile.specializedClass.properties);
        }
      );

    } else {

      helps.add(addNamespace(model.normalizedType, this.gettextCatalog), builder => {
        builder.newModel(exampleLibrary.prefix, exampleLibrary.name);
      });

      helps.add(createNewClass(
        exampleLibrary.newClass.name,
        exampleLibrary.newClass.comment,
        exampleLibrary.newClass.property.attribute.namespaceId,
        exampleLibrary.newClass.property.attribute.name, this.gettextCatalog), builder => {
          builder.newModel(exampleLibrary.prefix, exampleLibrary.name, exampleLibrary.importedLibrary.namespaceId);
        }
      );

      helps.add(assignClass(
        exampleLibrary.importedLibrary.namespaceId,
        exampleLibrary.assignedClass.name,
        this.gettextCatalog), builder => {
          builder.newModel(exampleLibrary.prefix, exampleLibrary.name, exampleLibrary.importedLibrary.namespaceId);
        }
      );

      helps.add(addAttribute(
        exampleLibrary.prefix,
        exampleLibrary.newClass.name,
        exampleLibrary.newClass.property.attribute.namespaceId,
        exampleLibrary.newClass.property.attribute.name,
        this.gettextCatalog), builder => {
          builder.newModel(exampleLibrary.prefix, exampleLibrary.name, exampleLibrary.importedLibrary.namespaceId);
          builder.newClass(exampleLibrary.newClass.name, exampleLibrary.newClass.comment);
        }
      );

      helps.add(addAssociation(
        exampleLibrary.prefix,
        exampleLibrary.newClass.name,
        exampleLibrary.newClass.property.association.searchName,
        exampleLibrary.newClass.property.association.name,
        exampleLibrary.newClass.property.association.comment,
        exampleLibrary.importedLibrary.namespaceId,
        exampleLibrary.assignedClass.name,
        this.gettextCatalog), builder => {
          builder.newModel(exampleLibrary.prefix, exampleLibrary.name, exampleLibrary.importedLibrary.namespaceId);
          builder.newClass(exampleLibrary.newClass.name, exampleLibrary.newClass.comment, {
            label: this.asLocalizable(exampleLibrary.newClass.name),
            predicate: predicateIdFromNamespaceId(exampleLibrary.newClass.property.attribute.namespaceId, exampleLibrary.newClass.property.attribute.name)
          });
          builder.assignClass(exampleLibrary.assignedClass.namespaceId, exampleLibrary.assignedClass.name);
      });
    }

    return helps.result;
  }
}


class ModelBuilder {

  private model?: IPromise<Model>;

  constructor(private entityLoader: EntityLoader,
              private contextModel: Model,
              private asLocalizable: (key: string) => Localizable) {
  }

  newModel(prefix: string, name: string, ...namespaces: string[]) {

    if (this.model) {
      throw new Error('Duplicate model initialization');
    }

    const type = this.contextModel.normalizedType;

    this.model = this.entityLoader.createModel(type, this.contextModel.groupId, {
      prefix,
      label: this.asLocalizable(name),
      namespaces: namespaces
    });

    return this.model;
  }

  newClass(name: string, comment: string, ...properties: PropertyDetails[]) {
    return this.entityLoader.createClass(requireDefined(this.model), {
      label: this.asLocalizable(name),
      comment: this.asLocalizable(comment),
      properties
    });
  }

  assignClass(namespaceId: string, name: string) {

    const model = requireDefined(this.model);
    const classToAssign = this.entityLoader.getClass(model, classIdFromNamespaceId(namespaceId, name));

    return this.entityLoader.assignClass(model, classToAssign);
  }

  specializeClass(namespaceId: string, name: string, properties: string[]) {
    return this.entityLoader.specializeClass(requireDefined(this.model), {
      class: classIdFromNamespaceId(namespaceId, name),
      propertyFilter: isExpectedProperty(properties)
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
