import { ModelView } from '../components/modelView.po';
import { Type } from '../../src/services/entities';
import { Language } from '../../src/utils/language';

export interface NewModelParameters {
  prefix: string;
  label: string;
  language: Language[];
  groupId: string;
  type: Type;
}

export class ModelPage {

  pathToNewModel(params: NewModelParameters) {
    const { prefix, label, language, groupId, type } = params;
    const languageQueryParameters = language.map(lang => `language=${lang}`).join('&');
    return `/#/model?prefix=${prefix}&label=${label}&${languageQueryParameters}&group=${groupId}&type=${type}`;
  }
  pathToExistingModel = (id: string) => `/#/model?urn=${encodeURIComponent(id)}`;
  pathWithClass = (id: string, classId: string) => this.pathToExistingModel(id) + `&class=${encodeURIComponent(classId)}`;
  pathWithAttribute = (id: string, attributeId: string) => this.pathToExistingModel(id) + `&attribute=${encodeURIComponent(attributeId)}`;
  pathWithAssociation = (id: string, associationId: string) => this.pathToExistingModel(id) + `&association=${encodeURIComponent(associationId)}`;

  navigateToNewModel = (params: NewModelParameters) => browser.get(this.pathToNewModel(params));
  navigateToExistingModel = (id: string) => browser.get(this.pathToExistingModel(id));
  navigateToClass = (id: string, classId: string) => browser.get(this.pathWithClass(id, classId));
  navigateToAttribute = (id: string, attributeId: string) => browser.get(this.pathWithClass(id, attributeId));
  navigateToAssociation = (id: string, associationId: string) => browser.get(this.pathWithClass(id, associationId));

  modelIdForPrefix = (prefix: string) => `http://iow.csc.fi/ns/${prefix}`;

  modelView: ModelView;

  constructor(private type: Type) {
    this.modelView = new ModelView(type);
  }
}
