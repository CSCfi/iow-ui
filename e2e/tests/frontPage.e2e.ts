import { FrontPage } from '../pages/frontPage.po';
import { GroupPage } from '../pages/group/groupPage.po';
import { expectCurrentUrlToEqualPath } from '../util/url';

describe('Front page', () => {

  const page = new FrontPage();
  const groupPage = new GroupPage();

  beforeEach(() => page.navigate());

  it('should have a title', () => {
    expect(page.title).toBe('IOW');
  });

  it('should have a footer', () => {
    expect(page.footer.isPresent()).toBe(true);
  });

  it('group should be navigable', () => {
    const firstLink = page.groupLinks.first();
    expect(firstLink.getText()).toBe('Yhteiset tietokomponentit');
    firstLink.click();
    expectCurrentUrlToEqualPath(groupPage.path(GroupPage.JHS_ID));
  });
});
