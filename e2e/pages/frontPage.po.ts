import EC = protractor.ExpectedConditions;

export class FrontPage {

  static path = '/';
  static navigate = () => {
    browser.get(FrontPage.path);
    const page = new FrontPage();
    page.waitToBeRendered();
    return page;
  };

  get title() { return browser.getTitle() };
  footer = element(by.css('footer'));
  groupLinks = element(by.id('browse-panel')).all(by.css('li'));

  waitToBeRendered() {
    browser.wait(EC.presenceOf(this.footer));
  }
}
