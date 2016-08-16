import { Modal } from './modal.po';

export class LoginModal extends Modal {

  loginButton = element(by.css('.modal-dialog #login-button'));

  login() {
    this.loginButton.click();
  }
}
