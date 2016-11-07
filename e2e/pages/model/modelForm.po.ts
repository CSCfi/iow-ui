import { LinksView } from './linksView.po';
import { NamespacesView } from './namespacesView.po';
import { ReferenceDataView } from './referenceDataView.po';
import { VocabulariesView } from './vocabulariesView.po';
import { EditableMultipleComponent } from '../common/component/editableMultipleComponent.po';
import { EditableComponent } from '../common/component/editableComponent.po';
import ElementFinder = protractor.ElementFinder;
import { KnownModelType } from '../../../src/entities/type';
import { upperCaseFirst } from 'change-case';

export class ModelForm {

  label: EditableComponent;
  description = EditableComponent.byTitleLocalizationKey(this.element, 'Description');
  language = EditableMultipleComponent.byElementNameAndTitleLocalizationKey(this.element, 'editable-multiple-language-select', 'Model languages');

  vocabularies = new VocabulariesView();
  referenceData = new ReferenceDataView();
  namespaces = new NamespacesView();
  links = new LinksView();

  constructor(public element: ElementFinder, type: KnownModelType) {
    this.label = EditableComponent.byTitleLocalizationKey(this.element, upperCaseFirst(type) + ' label');
  }
}
