import { Modal } from './modal.po';

export class LoginModal extends Modal {

  loginButton = element(by.css('.modal-dialog #login-button'));

  constructor() {
    super('login');
  }

  login() {
    this.loginButton.click();
  }
}
