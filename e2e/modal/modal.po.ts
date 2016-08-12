export class Modal {

  title = element(by.css('modal-title'));

  constructor() {
    // TODO better check for when angular template is rendered fully
    browser.sleep(200);
  }
}
