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
});
