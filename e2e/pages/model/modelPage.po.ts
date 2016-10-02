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
    return `/newModel?prefix=${prefix}&label=${encodeURIComponent(label)}&${languageQueryParameters}&group=${encodeURIComponent(groupId)}&type=${type}`;
  }
  static pathToExistingModel = (prefix: string) => `/model/${prefix}/`;
  static pathWithResource = (prefix: string, resourceName: string) => ModelPage.pathToExistingModel(prefix) + `/${resourceName}`;

  static navigateToNewModel = (params: NewModelParameters) => ModelPage.navigate(params.type, ModelPage.pathToNewModel(params));
  static navigateToExistingModel = (prefix: string, type: Type) =>  ModelPage.navigate(type, ModelPage.pathToExistingModel(prefix));
  static navigateToResource = (prefix: string, type: Type, resourceName: string) =>  ModelPage.navigate(type, ModelPage.pathWithResource(prefix, resourceName));

  modelView: ModelView;

  constructor(type: Type) {
    this.modelView = new ModelView(type);
  }
}
