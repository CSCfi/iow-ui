export class FrontPage {
  path = '/';
  navigate = () => browser.get(this.path);
  get title() { return browser.getTitle() };
  footer = element(by.css('footer'));
  groupLinks = element(by.id('browse-panel')).all(by.css('li'));
}
