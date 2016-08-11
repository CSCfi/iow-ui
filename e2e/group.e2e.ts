describe('Group', () => {

  beforeEach(() => {
    browser.get('/#/group?urn=https:%2F%2Ftt.eduuni.fi%2Fsites%2Fcsc-iow%23JHS');
  });

  it('should contain group info', () => {
    const editable = element(by.css('editable[data-title="Group label"] .content *'));
    expect(editable.getText()).toContain('Yhteiset tietokomponentit');
  });
});
