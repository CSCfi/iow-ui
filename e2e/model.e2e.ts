import { GroupPage } from './pages/group.po';
import { NavBar } from './components/navbar.po';

describe('Model', () => {

  const page = new GroupPage();
  const navbar = new NavBar();

  beforeEach(() => page.navigate(page.JHS_ID));

  describe('model creation', () => {

    beforeEach(() => navbar.ensureLoggedIn());

    it('should be logged in', () => {
      expect(navbar.isLoggedIn()).toBe(true);
    });

    it('can open model creation', () => {
      const addModelModal = page.addLibrary();
      expect(addModelModal.title.getText()).toBe('Lisää tietokomponenttikirjasto');
    });
  });
});
