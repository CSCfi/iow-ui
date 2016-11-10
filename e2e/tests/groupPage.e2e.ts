/// <reference types="protractor" />
/// <reference types="jasmine" />

import { GroupPage } from '../pages/group/groupPage.po';
import { expectCurrentUrlToEqualPath } from '../util/url';
import { NavBar } from '../pages/common/navbar.po';
import { library1Parameters } from './test-data';
import { ModelPage } from '../pages/model/modelPage.po';

describe('Group page', () => {

  let page: GroupPage;
  const navbar = new NavBar();

  beforeEach(() => {
    page = GroupPage.navigate(library1Parameters.groupId);
    navbar.ensureLoggedIn();
  });

  it('Should be logged in', () => {
    expect(navbar.isLoggedIn()).toBe(true);
  });

  it('Should contain group info', () => {
    expect(page.label.content.getText()).toContain('Yhteiset tietokomponentit');
  });

  it('Can open model creation', () => {
    const addModelModal = page.addLibrary();
    expect(addModelModal.title.getText()).toBe('Lisää tietokomponenttikirjasto');
    addModelModal.close();
    expect(addModelModal.isClosed()).toBe(true);
  });

  it('Creates unsaved model', () => {
    const addModelModal = page.addLibrary();
    addModelModal.prefix.setValue(library1Parameters.prefix);
    addModelModal.label.setValue(library1Parameters.label);
    addModelModal.language.setItems(library1Parameters.language);
    const modelPage = addModelModal.submit();
    expect(modelPage.modelView.title.getText()).toBe(library1Parameters.label);
    expectCurrentUrlToEqualPath(ModelPage.pathToNewModel(library1Parameters));
  });
});
