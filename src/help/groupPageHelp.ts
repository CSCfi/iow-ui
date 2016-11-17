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
import * as ModelForm from './pages/model/modelFormHelp.po';
import * as ClassView from './pages/model/classViewHelp.po';
import * as ClassForm from './pages/model/classFormHelp.po';
import * as VisualizationView from './pages/model/visualizationViewHelp.po';
import { exampleProfile, exampleLibrary } from './entities';
import gettextCatalog = angular.gettext.gettextCatalog;

export function createNewLibraryItems(gettextCatalog: gettextCatalog): Story[] {

  return [
    ...GroupPage.createModel('library', exampleLibrary.prefix, exampleLibrary.name, gettextCatalog),
    ModelForm.enterModelComment(ModelView.element, exampleLibrary.comment, gettextCatalog),
    NewModelPage.saveUnsavedModel,
    ModelPage.openModelDetails('library'),
    ModelView.modifyModel('library'),
    ...ModelView.addNamespaceItems(
      exampleLibrary.importedLibrary.prefix,
      exampleLibrary.importedLibrary.namespaceId,
      gettextCatalog
    ),
    ModelView.saveModelChanges,
    ...ModelPage.assignClassItems(
      exampleLibrary.assignedClass.namespaceId,
      exampleLibrary.assignedClass.name,
      gettextCatalog
    ),
    ...ModelPage.assignClassItems(
      exampleLibrary.assignedClass2.namespaceId,
      exampleLibrary.assignedClass2.name,
      gettextCatalog
    ),
    ...ModelPage.assignClassItems(
      exampleLibrary.assignedClass3.namespaceId,
      exampleLibrary.assignedClass3.name,
      gettextCatalog
    ),
    ...ModelPage.createNewClassItems(
      exampleLibrary.newClass.name,
      exampleLibrary.newClass.comment,
      gettextCatalog
    ),
    ...ClassView.addPropertyUsingExistingPredicateItems(
      'attribute',
      exampleLibrary.newClass.property.nameAttribute.namespaceId,
      exampleLibrary.newClass.property.nameAttribute.name,
      gettextCatalog
    ),
    ...ClassView.addPropertyBasedOnSuggestionItems(
      'attribute',
      exampleLibrary.newClass.property.passengersAttribute.searchName,
      exampleLibrary.newClass.property.passengersAttribute.name,
      exampleLibrary.newClass.property.passengersAttribute.comment,
      gettextCatalog
    ),
    ...ClassView.addPropertyBasedOnExistingConceptItems(
      'association',
      exampleLibrary.newClass.property.association.searchName,
      exampleLibrary.newClass.property.association.name,
      exampleLibrary.newClass.property.association.conceptId,
      gettextCatalog
    ),
    ...ClassForm.addAssociationTargetItems(
      ClassView.element,
      exampleLibrary.newClass.property.association.target.namespaceId,
      exampleLibrary.newClass.property.association.target.name,
      gettextCatalog
    ),
    ClassView.saveClassChanges,
    VisualizationView.focusVisualization
  ];
}

export function createNewProfileItems(gettextCatalog: gettextCatalog): Story[] {

  return [
    ...GroupPage.createModel('profile', exampleProfile.prefix, exampleProfile.name, gettextCatalog),
    NewModelPage.saveUnsavedModel,
    ModelPage.openModelDetails('profile'),
    ModelView.modifyModel('profile'),
    ...ModelView.addNamespaceItems(
      exampleProfile.importedLibrary.prefix,
      exampleProfile.importedLibrary.namespaceId,
      gettextCatalog
    ),
    ModelView.saveModelChanges,
    ...ModelPage.specializeClassItems(
      exampleProfile.specializedClass.namespaceId,
      exampleProfile.specializedClass.name,
      exampleProfile.specializedClass.properties,
      gettextCatalog
    ),
    ...ModelPage.createNewClassItems(
      exampleProfile.newClass.name,
      exampleProfile.newClass.comment,
      gettextCatalog
    ),
    ...ClassView.addPropertyUsingExistingPredicateItems(
      'attribute',
      exampleProfile.newClass.property.attribute.namespaceId,
      exampleProfile.newClass.property.attribute.name,
      gettextCatalog
    ),
    ...ClassView.addPropertyBasedOnSuggestionItems(
      'association',
      exampleProfile.newClass.property.association.searchName,
      exampleProfile.newClass.property.association.name,
      exampleProfile.newClass.property.association.comment,
      gettextCatalog
    ),
    ...ClassForm.addAssociationTargetItems(
      ClassView.element,
      exampleProfile.newClass.property.association.target.namespaceId,
      exampleProfile.newClass.property.association.target.name,
      gettextCatalog
    ),
    ClassView.saveClassChanges,
    VisualizationView.focusVisualization
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
