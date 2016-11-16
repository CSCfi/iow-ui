import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import {
  createHelpWithDefaultHandler, createNotification, InteractiveHelp, Story, Notification, StoryLine
} from './contract';
import { Group } from '../entities/group';
import { KnownModelType } from '../entities/type';
import * as GroupPage from './pages/group/groupPageHelp.po';
import * as NewModelPage from './pages/model/newModelPageHelp.po';
import * as ModelPage from './pages/model/modelPageHelp.po';
import * as ModelView from './pages/model/modelViewHelp.po';
import { exampleProfile, exampleLibrary } from './entities';
import { modelIdFromPrefix } from './utils';
import gettextCatalog = angular.gettext.gettextCatalog;

export function createNewLibraryItems(gettextCatalog: gettextCatalog): Story[] {

  return [
    ...GroupPage.createModel('library', exampleLibrary.prefix, exampleLibrary.name, gettextCatalog),
    NewModelPage.saveUnsavedModel,
    ModelPage.openModelDetails('library'),
    ModelView.modifyModel('library'),
    ...ModelPage.addNamespaceItems(gettextCatalog),
    ModelView.saveModelChanges,
    ...ModelPage.assignClassItems(
      exampleLibrary.importedLibrary.namespaceId,
      exampleLibrary.assignedClass.name,
      gettextCatalog
    ),
    ...ModelPage.createNewClassItems(
      exampleLibrary.newClass.name,
      exampleLibrary.newClass.comment,
      exampleLibrary.newClass.property.attribute.namespaceId,
      exampleLibrary.newClass.property.attribute.name, gettextCatalog
    ),
    ...ModelPage.addAssociationItems(
      exampleLibrary.newClass.property.association.searchName,
      exampleLibrary.newClass.property.association.name,
      exampleLibrary.newClass.property.association.comment,
      exampleLibrary.importedLibrary.namespaceId,
      exampleLibrary.assignedClass.name,
      gettextCatalog
    )
  ];
}

export function createNewProfileItems(gettextCatalog: gettextCatalog): Story[] {

  return [
    ...GroupPage.createModel('profile', exampleProfile.prefix, exampleProfile.name, gettextCatalog),
    NewModelPage.saveUnsavedModel,
    ModelPage.openModelDetails('profile'),
    ModelView.modifyModel('profile'),
    ...ModelPage.addNamespaceItems(gettextCatalog),
    ModelView.saveModelChanges,
    ...ModelPage.specializeClassItems(
      exampleProfile.importedLibrary.namespaceId,
      exampleProfile.specializedClass.name,
      exampleProfile.specializedClass.properties,
      gettextCatalog
    ),
    ...ModelPage.createNewClassItems(
      exampleProfile.newClass.name,
      exampleProfile.newClass.comment,
      exampleProfile.newClass.property.attribute.namespaceId,
      exampleProfile.newClass.property.attribute.name,
      gettextCatalog
    ),
    ...ModelPage.addAssociationItems(
      exampleProfile.newClass.property.association.searchName,
      exampleProfile.newClass.property.association.name,
      exampleProfile.newClass.property.association.comment,
      modelIdFromPrefix(exampleProfile.prefix),
      exampleProfile.specializedClass.name,
      gettextCatalog
    )
  ];
}

export function finishedCreateNewModelNotification(type: KnownModelType): Notification {
  return createNotification({
    title: `Congratulations for completing ${type} creation!`,
    content: `Congratulations for completing ${type} creation! description`
  });
}

function createNewModel(type: KnownModelType, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: `Guide through creating new ${type}`,
    description: `Guide through creating new ${type} description`,
    items: () => [
      ...(type === 'profile' ? createNewProfileItems(gettextCatalog) : createNewLibraryItems(gettextCatalog)),
      finishedCreateNewModelNotification(type)
    ]
  };
}

export class GroupPageHelpService {

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService, private $location: ILocationService, private gettextCatalog: gettextCatalog) {
  }

  private returnToGroupPage(group: Group) {
    this.$uibModalStack.dismissAll();
    this.$location.url(group.iowUrl());
  }

  getHelps(group: Group): InteractiveHelp[] {
    return [
      createHelpWithDefaultHandler(createNewModel('library', this.gettextCatalog), () => this.returnToGroupPage(group)),
      createHelpWithDefaultHandler(createNewModel('profile', this.gettextCatalog), () => this.returnToGroupPage(group))
    ];
  }
}
