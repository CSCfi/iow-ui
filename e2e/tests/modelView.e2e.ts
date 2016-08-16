import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';
import { libraryParameters } from './test-data';
import { ModelView } from '../pages/model/modelView.po';
import { VocabulariesView } from '../pages/model/vocabulariesView.po';

describe('Model view', () => {

  let view: ModelView;
  const navbar = new NavBar();

  beforeEach(() => {
    const page = ModelPage.navigateToExistingModel(ModelPage.modelIdForPrefix(libraryParameters.prefix), libraryParameters.type);
    navbar.ensureLoggedIn();
    page.modelView.ensureOpen();
    view = page.modelView;
  });

  it('Modifies model properties', () => {
    view.buttons.edit();
    view.label.appendValue('2');
    view.description.appendValue('Kuvaus');
    view.language.addItem('pl');
    view.buttons.save();

    expect(view.label.content.getText()).toBe(libraryParameters.label + '2');
    expect(view.description.content.getText()).toBe('Kuvaus');
    expect(view.language.content.getText()).toBe('fi, en, pl');
  });

  it('Adds vocabulary', () => {
    view.buttons.edit();
    const modal = view.vocabularies.addNew();
    modal.selectResult(VocabulariesView.EOS);
    view.buttons.save();
    expect(view.vocabularies.containsColumn(VocabulariesView.EOS)).toBe(true);
  });
});
