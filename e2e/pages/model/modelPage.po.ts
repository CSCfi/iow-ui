import { ModelView } from './modelView.po';
import { Language } from '../../../src/utils/language';
import { KnownModelType, ClassType, KnownPredicateType } from '../../../src/entities/type';
import { SearchClassModal } from '../editor/modal/searchClassModal.po';
import { ClassView } from '../editor/classView.po';
import { PredicateView } from '../editor/predicateView.po';
import { SearchPredicateModal } from '../editor/modal/searchPredicateModal.po';
import EC = protractor.ExpectedConditions;
import { assertNever } from '../../../src/utils/object';
import {
  AddResourceParameters, ClassDescriptor, resolveResourceId, PredicateDescriptor
} from '../../util/resource';

export interface NewModelParameters {
  prefix: string;
  label: string;
  language: Language[];
  groupId: string;
  type: KnownModelType;
}

type WaitFor = 'model-view' | 'editor' | 'resource-selection';

export class ModelPage {

  static navigate = (type: KnownModelType, path: string, waitFor: WaitFor) => {
    browser.get(path);
    const page = new ModelPage(type, waitFor);
    page.waitToBeRendered();
    return page;
  };

  static pathToNewModel(params: NewModelParameters) {
    const { prefix, label, language, groupId, type } = params;
    const languageQueryParameters = language.map(lang => `language=${encodeURIComponent(lang)}`).join('&');
    return `/newModel?prefix=${prefix}&label=${encodeURIComponent(label)}&${languageQueryParameters}&group=${encodeURIComponent(groupId)}&type=${type}`;
  }
  static pathToExistingModel = (prefix: string) => `/model/${prefix}/`;
  static pathWithResource = (prefix: string, resourceName: string) => ModelPage.pathToExistingModel(prefix) + `${resourceName}`;

  static navigateToNewModel = (params: NewModelParameters) => ModelPage.navigate(params.type, ModelPage.pathToNewModel(params), 'model-view');
  static navigateToExistingModel = (prefix: string, type: KnownModelType) =>  ModelPage.navigate(type, ModelPage.pathToExistingModel(prefix), 'resource-selection');
  static navigateToResource = (prefix: string, type: KnownModelType, resourceName: string) =>  ModelPage.navigate(type, ModelPage.pathWithResource(prefix, resourceName), 'editor');

  modelView = new ModelView(this.type);
  classView = (type: ClassType) => new ClassView(type);
  predicateView = (type: KnownPredicateType) => new PredicateView(type);

  resourceSelection = element(by.css('.model-panel--left'));
  resourceSelectionItems = this.resourceSelection.$('.panel__list');

  constructor(private type: KnownModelType, private waitFor: WaitFor) {
  }

  waitToBeRendered() {
    switch (this.waitFor) {
      case 'model-view':
        browser.wait(EC.visibilityOf(this.modelView.title));
        break;
      case 'editor':
        browser.wait(EC.visibilityOf(element(by.css('selection-view'))));
        break;
      case 'resource-selection':
        browser.wait(EC.visibilityOf(this.resourceSelection));
        break;
      default:
        assertNever(this.waitFor);
    }
  }

  ensureResourceTabIsOpen(tab: ClassType|KnownPredicateType) {
    switch (tab) {
      case 'class':
      case 'shape':
        this.resourceSelection.element(by.cssContainingText('li.uib-tab', 'Luokka')).click();
        break;
      case 'attribute':
        this.resourceSelection.element(by.cssContainingText('li.uib-tab', 'Attribuutti')).click();
        break;
      case 'association':
        this.resourceSelection.element(by.cssContainingText('li.uib-tab', 'Assosiaatio')).click();
        break;
      default:
        assertNever(tab);
    }
  }

  addClass(params: AddResourceParameters) {

    this.ensureResourceTabIsOpen('class');
    element(by.css('button.add-new-button')).click();

    const searchClass = new SearchClassModal();
    searchClass.search(params.name);

    switch (params.type) {
      case 'conceptSuggestion':
        const suggestionModal = searchClass.selectAddNew();
        suggestionModal.suggestNewConcept();
        suggestionModal.definition.appendValue('Definition');
        suggestionModal.confirm();
        break;
      case 'existingConcept':
        const conceptModal = searchClass.selectAddNew();
        conceptModal.selectResultById(params.conceptId);
        conceptModal.confirm();
        break;
      case 'existingResource':
        searchClass.selectResultById(params.id);
        searchClass.confirm();
        break;
      case 'externalResource':
        searchClass.selectAddNewExternal();
        searchClass.externalIdElement.setValue(params.id);
        searchClass.confirm();
        break;
      default:
        assertNever(params);
    }
  }

  addPredicate(type: KnownPredicateType, params: AddResourceParameters) {

    this.ensureResourceTabIsOpen(type);
    element(by.css('button.add-new-button')).click();

    const searchPredicate = new SearchPredicateModal(type);
    searchPredicate.search(params.name);

    switch (params.type) {
      case 'conceptSuggestion':
        const suggestionModal = searchPredicate.selectAddNew();
        suggestionModal.suggestNewConcept();
        suggestionModal.definition.appendValue('Definition');
        suggestionModal.confirm();
        break;
      case 'existingConcept':
        const conceptModal = searchPredicate.selectAddNew();
        conceptModal.selectResultById(params.conceptId);
        conceptModal.confirm();
        break;
      case 'existingResource':
        searchPredicate.selectResultById(params.id);
        searchPredicate.confirm();
        break;
      case 'externalResource':
        searchPredicate.selectAddNewExternal();
        searchPredicate.externalIdElement.setValue(params.id);
        searchPredicate.confirm();
        break;
      default:
        assertNever(params);
    }
  }

  addAttribute(params: AddResourceParameters) {
    this.addPredicate('attribute', params);
  }

  addAssociation(params: AddResourceParameters) {
    this.addPredicate('association', params);
  }

  selectResourceById(type: ClassType|KnownPredicateType, id: string) {
    browser.wait(EC.presenceOf(this.resourceSelection));
    this.ensureResourceTabIsOpen(type);
    this.resourceSelectionItems.element(by.css(`li#${CSS.escape(id)}`)).click();
  }

  selectClass(modelPrefix: string, klass: ClassDescriptor) {
    this.selectResourceById(klass.type, resolveResourceId(modelPrefix, klass));
    return this.classView(klass.type);
  }

  selectPredicate(modelPrefix: string, predicate: PredicateDescriptor) {
    this.selectResourceById(predicate.type, resolveResourceId(modelPrefix, predicate));
    return this.predicateView(predicate.type);
  }
}
