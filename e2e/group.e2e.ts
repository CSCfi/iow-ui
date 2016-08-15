import { GroupPage } from './pages/group.po';

describe('Group', () => {

  const page = new GroupPage();

  beforeEach(() => page.navigate(page.JHS_ID));

  it('should contain group info', () => {
    expect(page.label.content.getText()).toContain('Yhteiset tietokomponentit');
  });
});
