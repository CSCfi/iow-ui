describe('App', () => {

  beforeEach(() => {
    browser.get('/');
  });

  it('should have a title', () => {
    expect(browser.getTitle()).toBe('IOW');
  });

  it('should have a footer', () => {
    expect(element(by.css('footer')).isPresent()).toBeTruthy();
  });

  it('group should be navigable', () => {
    element(by.id('browse-panel')).all(by.css('li')).first().click();
    expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/#/group?urn=https:%2F%2Ftt.eduuni.fi%2Fsites%2Fcsc-iow%23JHS');
  });
});
