import { navigateAndReturn } from '../util/browser';
export class FrontPage {

  static path = '/';
  static navigate = () => navigateAndReturn(FrontPage.path, new FrontPage());

  get title() { return browser.getTitle() };
  footer = element(by.css('footer'));
  groupLinks = element(by.id('browse-panel')).all(by.css('li'));
}
