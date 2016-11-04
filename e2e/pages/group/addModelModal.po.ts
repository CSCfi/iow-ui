import { Modal } from '../common/modal.po';
import { EditableComponent } from '../common/component/editableComponent.po';
import { upperCaseFirst } from 'change-case';
import { ModelPage } from '../model/modelPage.po';
import { EditableMultipleComponent } from '../common/component/editableMultipleComponent.po';
import { SubmitButton } from '../common/component/submitButton.po';
import { KnownModelType } from '../../../src/entities/type';

export class AddModelModal extends Modal {

  prefix = EditableComponent.byTitleLocalizationKey(this.element, 'Prefix');
  label: EditableComponent;
  language = EditableMultipleComponent.byElementNameAndTitleLocalizationKey(this.element, 'editable-multiple-language-select', 'Model languages');
  submitButton = new SubmitButton(element(by.buttonText('Luo uusi')));

  constructor(private type: KnownModelType) {
    super();
    this.label = EditableComponent.byTitleLocalizationKey(this.element, upperCaseFirst(type) + ' label');
  }

  submit() {
    this.submitButton.submit();
    const modelPage = new ModelPage(this.type);
    browser.wait(modelPage.modelView.element.isDisplayed);
    return new ModelPage(this.type);
  }
}
