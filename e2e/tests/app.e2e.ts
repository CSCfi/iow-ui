import { ApplicationPage } from '../pages/app.po';
import { GroupPage } from '../pages/group/group.po';
import { applicationUrl } from '../util/url';

describe('App', () => {

  const page = new ApplicationPage();
  const groupPage = new GroupPage();

  beforeEach(() => page.navigate());

  it('should have a title', () => {
    expect(page.title).toBe('IOW');
  });

  it('should have a footer', () => {
    expect(page.footer.isPresent()).toBe(true);
  });

  it('group should be navigable', () => {
    page.groupLinks.first().click();
    expect(browser.getCurrentUrl().then(decodeURIComponent)).toEqual(decodeURIComponent(applicationUrl + groupPage.path(GroupPage.JHS_ID)));
  });
});

require('./group.e2e');
require('./model.e2e');
