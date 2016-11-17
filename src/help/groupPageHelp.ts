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
    ...ModelView.addNamespaceItems(exampleLibrary.importedLibrary, gettextCatalog),
    ModelView.saveModelChanges,
    ...ModelPage.assignClassItems(exampleLibrary.person, gettextCatalog),
    ...ModelPage.assignClassItems(exampleLibrary.contact, gettextCatalog),
    ...ModelPage.assignClassItems(exampleLibrary.address, gettextCatalog),
    ...ModelPage.createNewClassItems(exampleLibrary.newClass, gettextCatalog),
    ...ClassForm.addSuperClassItems(ClassView.element, exampleLibrary.newClass.superClass, gettextCatalog),
    ...ClassView.addPropertyUsingExistingPredicateItems(exampleLibrary.newClass.property.name, gettextCatalog),
    ...ClassView.addPropertyBasedOnSuggestionItems(exampleLibrary.newClass.property.passengers, gettextCatalog),
    ...ClassView.addPropertyBasedOnExistingConceptItems(exampleLibrary.newClass.property.owner, gettextCatalog),
    ...ClassForm.addAssociationTargetItems(ClassView.element, exampleLibrary.newClass.property.owner.target, gettextCatalog),
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
    ...ModelView.addNamespaceItems(exampleProfile.importedLibrary, gettextCatalog),
    ModelView.saveModelChanges,
    ...ModelPage.specializeClassItems(exampleProfile.specializedClass, gettextCatalog),
    ...ModelPage.createNewClassItems(exampleProfile.newClass, gettextCatalog),
    ...ClassView.addPropertyUsingExistingPredicateItems(exampleProfile.newClass.property.name, gettextCatalog),
    ...ClassView.addPropertyBasedOnSuggestionItems(exampleProfile.newClass.property.produced, gettextCatalog),
    ...ClassForm.addAssociationTargetItems(ClassView.element, exampleProfile.newClass.property.produced.target, gettextCatalog),
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
