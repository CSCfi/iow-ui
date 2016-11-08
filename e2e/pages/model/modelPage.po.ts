import { ModelView } from './modelView.po';
import { Language } from '../../../src/utils/language';
import { navigateAndReturn } from '../../util/browser';
import { KnownModelType, ClassType, KnownPredicateType } from '../../../src/entities/type';
import { SearchClassModal } from '../editor/modal/searchClassModal.po';
import { ClassView } from '../editor/classView.po';
import { PredicateView } from '../editor/predicateView.po';
import { SearchPredicateModal } from '../editor/modal/searchPredicateModal.po';

export interface NewModelParameters {
  prefix: string;
  label: string;
  language: Language[];
  groupId: string;
  type: KnownModelType;
}

export class ModelPage {

  static navigate = (type: KnownModelType, path: string) => navigateAndReturn(path, new ModelPage(type));

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

  constructor(private type: KnownModelType) {
  }

  addClass() {
    element(by.cssContainingText('li.uib-tab', 'Luokka')).click();
    element(by.css('button.add-new-button')).click();
    return new SearchClassModal();
  }

  addAttribute() {
    element(by.cssContainingText('li.uib-tab', 'Attribuutti')).click();
    element(by.css('button.add-new-button')).click();
    return new SearchPredicateModal('attribute');
  }

  addAssociation() {
    element(by.cssContainingText('li.uib-tab', 'Assosiaatio')).click();
    element(by.css('button.add-new-button')).click();
    return new SearchPredicateModal('association');
  }
}
