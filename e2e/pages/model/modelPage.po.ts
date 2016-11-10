import { ModelView } from './modelView.po';
import { Language } from '../../../src/utils/language';
import { navigateAndReturn } from '../../util/browser';
import { KnownModelType, ClassType, KnownPredicateType } from '../../../src/entities/type';
import { SearchClassModal } from '../editor/modal/searchClassModal.po';
import { ClassView } from '../editor/classView.po';
import { PredicateView } from '../editor/predicateView.po';
import { SearchPredicateModal } from '../editor/modal/searchPredicateModal.po';
import EC = protractor.ExpectedConditions;
import { assertNever } from '../../../src/utils/object';
import { AddResourceParameters } from '../../util/resource';

export interface NewModelParameters {
  prefix: string;
  label: string;
  language: Language[];
  groupId: string;
  type: KnownModelType;
}

export class ModelPage {

  static navigate = (type: KnownModelType, path: string) => navigateAndReturn(path, new ModelPage(type, false));

  static pathToNewModel(params: NewModelParameters) {
    const { prefix, label, language, groupId, type } = params;
    const languageQueryParameters = language.map(lang => `language=${encodeURIComponent(lang)}`).join('&');
    return `/newModel?prefix=${prefix}&label=${encodeURIComponent(label)}&${languageQueryParameters}&group=${encodeURIComponent(groupId)}&type=${type}`;
  }
  static pathToExistingModel = (prefix: string) => `/model/${prefix}/`;
  static pathWithResource = (prefix: string, resourceName: string) => ModelPage.pathToExistingModel(prefix) + `${resourceName}`;

  static navigateToNewModel = (params: NewModelParameters) => ModelPage.navigate(params.type, ModelPage.pathToNewModel(params));
  static navigateToExistingModel = (prefix: string, type: KnownModelType) =>  ModelPage.navigate(type, ModelPage.pathToExistingModel(prefix));
  static navigateToResource = (prefix: string, type: KnownModelType, resourceName: string) =>  ModelPage.navigate(type, ModelPage.pathWithResource(prefix, resourceName));

  modelView = new ModelView(this.type);
  classView = (type: ClassType) => new ClassView(type);
  predicateView = (type: KnownPredicateType) => new PredicateView(type);

  resourceSelection = element(by.css('.model-panel--left'));

  constructor(private type: KnownModelType, private newModel: boolean) {
  }

  waitToBeRendered() {
    if (this.newModel) {
      browser.wait(EC.presenceOf(this.modelView.title));
    } else {
      browser.wait(EC.presenceOf(this.resourceSelection));
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
    this.waitToBeRendered();

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

    this.waitToBeRendered();

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
}
