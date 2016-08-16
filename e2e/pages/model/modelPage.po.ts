import { ModelView } from './modelView.po';
import { Type } from '../../../src/services/entities';
import { Language } from '../../../src/utils/language';
import { navigateAndReturn } from '../../util/browser';

export interface NewModelParameters {
  prefix: string;
  label: string;
  language: Language[];
  groupId: string;
  type: Type;
}

export class ModelPage {

  static navigate = (type: Type, path: string) => navigateAndReturn(path, new ModelPage(type));

  static pathToNewModel(params: NewModelParameters) {
    const { prefix, label, language, groupId, type } = params;
    const languageQueryParameters = language.map(lang => `language=${encodeURIComponent(lang)}`).join('&');
    return `/#/model?prefix=${prefix}&label=${encodeURIComponent(label)}&${languageQueryParameters}&group=${encodeURIComponent(groupId)}&type=${type}`;
  }
  static pathToExistingModel = (id: string) => `/#/model?urn=${encodeURIComponent(id)}`;
  static pathWithClass = (id: string, classId: string) => ModelPage.pathToExistingModel(id) + `&class=${encodeURIComponent(classId)}`;
  static pathWithAttribute = (id: string, attributeId: string) => ModelPage.pathToExistingModel(id) + `&attribute=${encodeURIComponent(attributeId)}`;
  static pathWithAssociation = (id: string, associationId: string) => ModelPage.pathToExistingModel(id) + `&association=${encodeURIComponent(associationId)}`;

  static navigateToNewModel = (params: NewModelParameters) => ModelPage.navigate(params.type, ModelPage.pathToNewModel(params));
  static navigateToExistingModel = (id: string, type: Type) =>  ModelPage.navigate(type, ModelPage.pathToExistingModel(id));
  static navigateToClass = (id: string, type: Type, classId: string) =>  ModelPage.navigate(type, ModelPage.pathWithClass(id, classId));
  static navigateToAttribute = (id: string, type: Type, attributeId: string) =>  ModelPage.navigate(type, ModelPage.pathWithClass(id, attributeId));
  static navigateToAssociation = (id: string, type: Type, associationId: string) =>  ModelPage.navigate(type, ModelPage.pathWithClass(id, associationId));

  static modelIdForPrefix = (prefix: string) => `http://iow.csc.fi/ns/${prefix}`;

  modelView: ModelView;

  constructor(private type: Type) {
    this.modelView = new ModelView(type);
  }
}
