import { ElementFinder } from 'protractor';
import { LoginModal } from './loginModal.po';

export class NavBar {

  element: ElementFinder;

  constructor() {
    this.element = element(by.css('.nav'));
  }

  isLoggedIn() {
    return this.element.$('#logout').isPresent();
  }

  login() {
    this.element.$('#login').click();
    return new LoginModal();
  }

  ensureLoggedIn() {
    return this.isLoggedIn().then(logged => {
      if (!logged) {
        this.login().login();
      }
    });
  }
}
