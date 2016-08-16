import { ModelPage } from '../pages/model/modelPage.po';
import { expectCurrentUrlToEqualPath } from '../util/url';
import { libraryParameters } from './test-data';
import { NavBar } from '../pages/common/navbar.po';
import { GroupPage } from '../pages/group/groupPage.po';

describe('Model page', () => {

  let page: ModelPage;
  const navbar = new NavBar();

  describe('Before model is created', () => {

    beforeEach(() => {
      page = ModelPage.navigateToNewModel(libraryParameters);
      navbar.ensureLoggedIn();
    });

    it('Creates saved model', () => {
      page.modelView.buttons.save();
      expectCurrentUrlToEqualPath(ModelPage.pathToExistingModel(ModelPage.modelIdForPrefix(libraryParameters.prefix)));
    });
  });

  describe('After model is created', () => {

    beforeEach(() => {
      page = ModelPage.navigateToExistingModel(ModelPage.modelIdForPrefix(libraryParameters.prefix), libraryParameters.type);
      navbar.ensureLoggedIn();
      page.modelView.ensureOpen();
    });

    it('Modifies model properties', () => {
      page.modelView.buttons.edit();
      page.modelView.label.appendValue('2');
      page.modelView.description.appendValue('Kuvaus');
      page.modelView.language.addItem('pl');
      page.modelView.buttons.save();

      expect(page.modelView.label.content.getText()).toBe(libraryParameters.label + '2');
      expect(page.modelView.description.content.getText()).toBe('Kuvaus');
      expect(page.modelView.language.content.getText()).toBe('fi, en, pl');
    });

    // TODO rest of tests with created model

    it('Removes model', () => {
      page.modelView.buttons.removeAndConfirm();
      expectCurrentUrlToEqualPath(GroupPage.path(libraryParameters.groupId));
    });
  });
});
