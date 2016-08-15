import { Modal } from './modal.po';
import { Type } from '../../src/services/entities';
import { EditableComponent } from '../components/editableComponent.po';
import { upperCaseFirst } from 'change-case';
import { ModelPage } from '../pages/model.po';
import { Language } from '../../src/utils/language';
import { MultipleEditableComponent } from '../components/multipleEditableComponent.po';

export class AddModelModal extends Modal {

  prefix = EditableComponent.byTitleLocalizationKey('Prefix');
  label: EditableComponent;
  language = MultipleEditableComponent.byElementNameAndTitleLocalizationKey('editable-multiple-language-select', 'Model languages');
  submitButton = element(by.buttonText('Luo uusi'));

  constructor(private type: Type) {
    super();
    this.label = EditableComponent.byTitleLocalizationKey(upperCaseFirst(type) + ' label');
  }

  setValues(values: { prefix: string, label: string, language: Language[] }) {
    this.prefix.setValue(values.prefix);
    this.label.setValue(values.label);
    this.language.setItems(values.language);
  }

  submit() {
    this.submitButton.click();
    return new ModelPage(this.type);
  }
}
